import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const BAIDUSPIDER_UA = 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)';

// Common AI generated phrases in Chinese
const AI_PHRASES = [
  '总而言之', '毋庸置疑', '值得注意的是', '深入探讨', '在这个瞬息万变的时代',
  '不可否认', '不仅...更...', '希望本文能为您提供', '请注意',
  '总的来说', '综上所述', '笔者认为', '正如前文所述', '由此可见',
  '这是一个复杂的问题', '没有绝对的答案', '取决于多种因素',
  '首先', '其次', '再次', '最后', '总结一下', '在当今社会',
  '随着科技的不断发展', '在本文中', '我们将探讨', '为您解答',
  '让我们一起来看看', '这篇文章将', '探讨了', '分析了', '为您揭秘'
];

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: '请提供 URL' }, { status: 400 });
    }

    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'http://' + targetUrl;
    }

    // Fetch the URL pretending to be Baiduspider
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': BAIDUSPIDER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      },
      // some sites might take a while, standard fetch doesn't have timeout, but we rely on Vercel's or Node's defaults
    });

    if (!response.ok) {
      return NextResponse.json({ error: `无法访问该网页，HTTP状态码: ${response.status}` }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Extract Basic Info
    const title = $('title').text().trim();
    const hasViewport = $('meta[name="viewport"]').length > 0;
    
    // Remove unwanted elements before extracting text
    $('script, style, noscript, iframe, img, svg, nav, footer, header').remove();
    const rawText = $('body').text();
    // Clean up excessive whitespace
    const cleanText = rawText.replace(/\s+/g, ' ').trim();
    
    const textLength = cleanText.length;
    const htmlLength = html.length;
    const textToHtmlRatio = htmlLength > 0 ? textLength / htmlLength : 0;

    // 2. AIGC Detection (AI 痕迹检测)
    let aiPhrasesFound: string[] = [];
    let aiScore = 0; // 0-100, higher means more likely AI

    AI_PHRASES.forEach(phrase => {
      // Use regex to find all occurrences
      const regex = new RegExp(phrase, 'gi');
      const matches = cleanText.match(regex);
      if (matches && matches.length > 0) {
        aiPhrasesFound.push(`${phrase} (出现 ${matches.length} 次)`);
        aiScore += matches.length * 5; // Each occurrence adds 5 points
      }
    });

    // Mechanical structure detection (Sentence length variance - simplified)
    const sentences = cleanText.split(/([。！？.!?])/).filter(s => s.trim().length > 0);
    let structureWarning = false;
    if (sentences.length > 10) {
      // Very basic variance check: if most sentences are roughly the same length, it's robotic
      const lengths = sentences.map(s => s.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((a, b) => a + Math.pow(b - avgLength, 2), 0) / lengths.length;
      
      // If variance is very low, it means uniform sentence length
      if (variance < 20 && avgLength > 10) {
         structureWarning = true;
         aiScore += 20;
      }
    }

    // Cap AI Score at 100
    aiScore = Math.min(100, aiScore);

    // 3. SEO Algorithms Checks

    // 清风算法 (Qingfeng - Title checks)
    let titleIssues = [];
    if (title.length > 40) {
      titleIssues.push('标题过长（超过40个字符），可能被百度清风算法惩罚。');
    }
    if (title.length === 0) {
      titleIssues.push('缺少标题标签。');
    }
    // Check keyword stuffing in title (basic duplicate word check)
    const titleWords = title.split(/[\s,，|_\\-]/).filter(w => w.length > 1);
    const uniqueWords = new Set(titleWords);
    if (titleWords.length > uniqueWords.size + 2) {
       titleIssues.push('标题中可能存在关键词堆砌，触碰清风算法红线。');
    }

    // 飓风/劲风算法 (Hurricane/Jingfeng - Content quality checks)
    let contentIssues = [];
    if (textLength < 300) {
      contentIssues.push(`正文字数过少（仅 ${textLength} 字），容易被判定为低质内容或空短页面。`);
    }
    if (textToHtmlRatio < 0.05) {
      contentIssues.push('网页文本代码比（Text-to-HTML Ratio）极低，页面可能充斥了过多的结构和链接而缺乏实质内容，符合恶劣聚合页特征。');
    }

    // 冰桶算法 (Ice Bucket - Mobile experience)
    let mobileIssues = [];
    if (!hasViewport) {
      mobileIssues.push('缺少 viewport 标签，页面未进行移动端适配，严重违反冰桶算法。');
    }

    // Fixed elements check (potential annoying popups)
    // Note: Cheerio can't evaluate computed styles, we can only check inline styles which is limited.
    // We'll skip deep CSS parsing for now and rely on meta tags for basic Ice Bucket check.

    // Calculate Overall SEO Health (0-100)
    let seoScore = 100;
    seoScore -= titleIssues.length * 10;
    seoScore -= contentIssues.length * 15;
    seoScore -= mobileIssues.length * 20;
    seoScore = Math.max(0, seoScore);

    return NextResponse.json({
      success: true,
      data: {
        url: targetUrl,
        title,
        textLength,
        textToHtmlRatio: (textToHtmlRatio * 100).toFixed(2) + '%',
        aigc: {
          score: aiScore,
          probability: aiScore > 60 ? '极高' : (aiScore > 30 ? '中等' : '较低'),
          phrasesFound: aiPhrasesFound,
          structureWarning
        },
        seo: {
          score: seoScore,
          titleIssues,
          contentIssues,
          mobileIssues
        }
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || '分析过程中发生错误' }, { status: 500 });
  }
}
