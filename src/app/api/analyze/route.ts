import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const BAIDUSPIDER_UA = 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)';

const AI_PHRASES = [
  '总而言之', '毋庸置疑', '值得注意的是', '深入探讨', '在这个瞬息万变的时代',
  '不可否认', '不仅...更...', '希望本文能为您提供', '请注意',
  '总的来说', '综上所述', '笔者认为', '正如前文所述', '由此可见',
  '这是一个复杂的问题', '没有绝对的答案', '取决于多种因素',
  '首先', '其次', '再次', '最后', '总结一下', '在当今社会',
  '随着科技的不断发展', '在本文中', '我们将探讨', '为您解答',
  '让我们一起来看看', '这篇文章将', '探讨了', '分析了', '为您揭秘'
];

// Experience keywords (First-hand experience)
const EXP_KEYWORDS = ['我发现', '实测', '亲身经历', '我曾经', '测试结果', '我的看法', '个人认为', '体验下来'];
// YMYL (Your Money or Your Life) indicators
const YMYL_KEYWORDS = ['治疗', '诊断', '症状', '投资', '收益', '理财', '贷款', '法律', '律师', '起诉'];

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

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': BAIDUSPIDER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      },
      // Set a reasonable timeout constraint in production, Vercel default is usually enough here
    });

    if (!response.ok) {
      return NextResponse.json({ error: `无法访问该网页，HTTP状态码: ${response.status}` }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ==========================================
    // 1. Basic Meta Extraction
    // ==========================================
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const isHttps = targetUrl.startsWith('https://');

    // ==========================================
    // 2. Spider Vision (Simulate Baidu Spider)
    // ==========================================
    const $spider = cheerio.load(html);
    $spider('script, style, noscript, svg, iframe, canvas, video, audio').remove();
    
    const h1s: string[] = [];
    $spider('h1').each((_, el) => { h1s.push($(el).text().trim()); });
    const h2s: string[] = [];
    $spider('h2').each((_, el) => { h2s.push($(el).text().trim()); });
    
    let linksCount = 0;
    let outLinksCount = 0;
    $spider('a').each((_, el) => {
      linksCount++;
      const href = $(el).attr('href');
      if (href && href.startsWith('http') && !href.includes(new URL(targetUrl).hostname)) {
        outLinksCount++;
      }
    });

    let imagesCount = 0;
    let imagesWithoutAlt = 0;
    $spider('img').each((_, el) => {
      imagesCount++;
      if (!$(el).attr('alt')) {
        imagesWithoutAlt++;
      }
    });

    const rawText = $spider('body').text().replace(/\s+/g, ' ').trim();
    const textLength = rawText.length;
    const htmlLength = html.length;
    const textToHtmlRatio = htmlLength > 0 ? textLength / htmlLength : 0;

    const spiderVision = {
      rawText: rawText.substring(0, 5000) + (rawText.length > 5000 ? '...[内容被截断]' : ''),
      h1: h1s,
      h2: h2s,
      linksCount,
      outLinksCount,
      imagesCount,
      imagesWithoutAlt,
      textLength,
      textToHtmlRatio: (textToHtmlRatio * 100).toFixed(2) + '%'
    };

    // ==========================================
    // 3. Baidu Algorithms Checks
    // ==========================================
    const algorithms: any = {};

    // 3.1 清风算法 (Qingfeng - Title checks)
    const qingfengIssues = [];
    if (title.length > 40) qingfengIssues.push('标题过长（超过40个字符），可能被判定为堆砌。');
    if (title.length === 0) qingfengIssues.push('完全缺少 <title> 标签。');
    const titleWords = title.split(/[\s,，|_\\-]/).filter(w => w.length > 1);
    const uniqueWords = new Set(titleWords);
    if (titleWords.length > uniqueWords.size + 2) qingfengIssues.push('标题中可能存在关键词过度重复堆砌。');
    
    algorithms.qingfeng = {
      passed: qingfengIssues.length === 0,
      issues: qingfengIssues,
      desc: '百度清风算法旨在严惩通过网页标题作弊（如标题堆砌、标题党、虚假下载等）欺骗用户的行为。'
    };

    // 3.2 细雨算法 (Xiyu - B2B/Contact info in title)
    const xiyuIssues = [];
    if (/(手机|电话|微信|QQ|微信号)：?\s*(\d{7,11}|[a-zA-Z0-9_]{5,20})/i.test(title)) {
      xiyuIssues.push('标题中含有明显的联系方式（电话、微信等），严重触犯细雨算法。');
    }
    if (/[【】★◆■▲▼☆◇△\+]/i.test(title)) {
       xiyuIssues.push('标题包含大量特殊火星文或诱导点击的特殊符号。');
    }
    algorithms.xiyu = {
      passed: xiyuIssues.length === 0,
      issues: xiyuIssues,
      desc: '百度细雨算法主要规范B2B领域，严厉打击在标题中穿插联系电话、微信号、特殊符号等影响阅读的作弊行为。'
    };

    // 3.3 飓风/劲风算法 (Jingfeng/Hurricane - Content Quality)
    const jufengIssues = [];
    if (textLength < 200) jufengIssues.push(`正文字数极少（${textLength} 字），容易被判定为空短页面或低质采集页。`);
    if (textToHtmlRatio < 0.05) jufengIssues.push('网页文本代码比极低（<5%），页面可能充斥结构代码而缺乏实质原创内容。');
    if (metaDesc.length === 0) jufengIssues.push('缺少 Meta Description，不利于搜索引擎评估页面摘要内容质量。');
    algorithms.jufeng = {
      passed: jufengIssues.length === 0,
      issues: jufengIssues,
      desc: '飓风算法严打恶劣采集；劲风算法处理内容与标题描述不符、空短、无有效信息的聚合页。两者都对实质内容质量要求极高。'
    };

    // 3.4 冰桶/石榴算法 (Ice Bucket/Pomegranate - Mobile & Ads)
    const bingtongIssues = [];
    const hasViewport = $('meta[name="viewport"]').length > 0;
    if (!hasViewport) bingtongIssues.push('缺少 viewport 标签，页面未进行移动端适配，严重违反冰桶算法。');
    
    // Attempt to detect forced app links or large fixed ads
    let adWarning = false;
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('schema://') || href.includes('download') || href.includes('.apk')) {
        adWarning = true;
      }
    });
    if (adWarning) bingtongIssues.push('页面可能包含应用下载链接，如果涉及强制弹窗下载或大面积遮挡主体，将遭到冰桶/石榴算法严重降权。');
    
    algorithms.bingtong = {
      passed: bingtongIssues.length === 0,
      issues: bingtongIssues,
      desc: '冰桶算法打击移动端强行弹窗、遮挡、强制下载；石榴算法打击大量妨碍用户正常浏览的恶劣广告。'
    };

    // 3.5 天网算法 (Tianwang - User Access Restriction)
    const tianwangIssues = [];
    const lowerHtml = html.toLowerCase();
    if (lowerHtml.includes('需登录') || lowerHtml.includes('登录后查看') || lowerHtml.includes('关注公众号查看全文')) {
      tianwangIssues.push('页面源码中发现“强制登录/关注获取内容”特征，严重损害用户信息获取体验。');
    }
    algorithms.tianwang = {
      passed: tianwangIssues.length === 0,
      issues: tianwangIssues,
      desc: '天网算法主要打击强制用户完成关注、登录、下载APP等操作才能获取信息的行为。'
    };

    // ==========================================
    // 4. E-E-A-T Score System
    // ==========================================
    const eeat: any = { score: 0, max: 100, breakdown: {} };
    
    // Experience (25 pts)
    let expScore = 5; // Base
    const expFactors = [];
    let expFound = 0;
    EXP_KEYWORDS.forEach(kw => {
      if (rawText.includes(kw)) expFound++;
    });
    if (expFound > 0) {
      expScore += 20;
      expFactors.push(`发现第一人称经验词汇（如“实测”、“我发现”等），体现了创作者的亲身实践 (+20分)`);
    } else {
      expFactors.push(`未发现明显的第一人称实践/测评特征词，建议增加真实体验细节。`);
    }
    eeat.breakdown.experience = { score: expScore, max: 25, factors: expFactors };

    // Expertise (25 pts)
    let expertScore = 10;
    const expertFactors = [];
    let isYMYL = false;
    YMYL_KEYWORDS.forEach(kw => { if (rawText.includes(kw)) isYMYL = true; });
    if (isYMYL) expertFactors.push('⚠️ 系统判定此页面涉及 YMYL (你的钱或生命，如医疗/金融/法律) 领域，百度对此类内容的专业性要求极高！');
    
    const hasAuthor = $('meta[name="author"]').length > 0 || rawText.includes('作者：') || rawText.includes('编辑：');
    if (hasAuthor) {
      expertScore += 15;
      expertFactors.push('页面包含明确的作者/编辑署名标识 (+15分)');
    } else {
      expertFactors.push('缺乏明确的作者署名或资质背书，削弱了专业形象。');
      if (isYMYL) expertScore = Math.max(0, expertScore - 10); // YMYL penalty
    }
    eeat.breakdown.expertise = { score: expertScore, max: 25, factors: expertFactors };

    // Authoritativeness (25 pts)
    let authScore = 10;
    const authFactors = [];
    if (outLinksCount > 0) {
      authScore += 10;
      authFactors.push(`页面包含 ${outLinksCount} 个外部参考链接，有助于提升内容的权威支撑 (+10分)`);
    } else {
      authFactors.push('未发现指向外部权威网站的引用链接。');
    }
    if (spiderVision.h1.length === 1) {
      authScore += 5;
      authFactors.push('H1 标签结构规范，强化了当前页面的核心权威主题 (+5分)');
    }
    eeat.breakdown.authoritativeness = { score: authScore, max: 25, factors: authFactors };

    // Trustworthiness (25 pts)
    let trustScore = 5;
    const trustFactors = [];
    if (isHttps) {
      trustScore += 10;
      trustFactors.push('采用 HTTPS 加密传输，保障访问安全 (+10分)');
    } else {
      trustFactors.push('使用 HTTP 明文传输，安全信任度大幅降低 (-10分)');
    }
    
    if (lowerHtml.includes('icp备案') || lowerHtml.includes('京icp备') || lowerHtml.includes('沪icp备') || lowerHtml.includes('粤icp备')) {
      trustScore += 10;
      trustFactors.push('页面底部展示了正规的 ICP 备案信息，大幅提升网站可信度 (+10分)');
    } else {
      trustFactors.push('未提取到 ICP 备案标识特征。');
    }
    eeat.breakdown.trustworthiness = { score: trustScore, max: 25, factors: trustFactors };

    eeat.score = expScore + expertScore + authScore + trustScore;

    // ==========================================
    // 5. AIGC Detection
    // ==========================================
    let aiPhrasesFound: string[] = [];
    let aiScore = 0; 
    AI_PHRASES.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      const matches = rawText.match(regex);
      if (matches && matches.length > 0) {
        aiPhrasesFound.push(`${phrase} (${matches.length}次)`);
        aiScore += matches.length * 5;
      }
    });

    const sentences = rawText.split(/([。！？.!?])/).filter(s => s.trim().length > 0);
    let structureWarning = false;
    if (sentences.length > 10) {
      const lengths = sentences.map(s => s.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((a, b) => a + Math.pow(b - avgLength, 2), 0) / lengths.length;
      if (variance < 20 && avgLength > 10) {
         structureWarning = true;
         aiScore += 20;
      }
    }
    aiScore = Math.min(100, aiScore);


    // ==========================================
    // Output Generation
    // ==========================================
    return NextResponse.json({
      success: true,
      data: {
        url: targetUrl,
        title,
        meta: {
          description: metaDesc,
          keywords: metaKeywords
        },
        spiderVision,
        algorithms,
        eeat,
        aigc: {
          score: aiScore,
          probability: aiScore > 60 ? '极高风险' : (aiScore > 30 ? '中等风险' : '低风险'),
          phrasesFound: aiPhrasesFound,
          structureWarning
        }
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || '分析过程中发生错误' }, { status: 500 });
  }
}
