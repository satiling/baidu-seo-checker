'use client';

import { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle, Bot, Zap, Smartphone, FileText } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const analyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '分析失败');
      }
      
      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 md:p-24 flex flex-col items-center">
      
      <div className="text-center mb-12 max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight glow-text text-white">
          百度SEO & <span className="text-neon-pink">AI内容</span> 检查器
        </h1>
        <p className="text-gray-400 text-lg">
          深度检测 AIGC 痕迹，模拟 Baiduspider 视角的 SEO 核心算法体检
        </p>
      </div>

      <form onSubmit={analyzeUrl} className="w-full max-w-2xl relative mb-12 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center glass-panel rounded-full p-2 pl-6">
          <Search className="w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入网页URL (例如: https://example.com/article/1)"
            className="flex-1 bg-transparent border-none outline-none text-white px-4 text-lg placeholder:text-gray-600"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-neon-blue hover:bg-neon-purple text-black font-semibold rounded-full px-8 py-3 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                分析中...
              </>
            ) : (
              '开始诊断'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="glass-panel border-red-500/50 bg-red-500/10 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 mb-8 w-full max-w-4xl">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          {error}
        </div>
      )}

      {result && (
        <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AIGC Card */}
            <div className={cn(
              "glass-panel rounded-2xl p-6 relative overflow-hidden",
              result.aigc.score > 50 ? "border-red-500/30" : "border-green-500/30"
            )}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Bot className="w-24 h-24" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                <Bot className="w-6 h-6 text-neon-pink" /> 
                AI 痕迹诊断 (AIGC)
              </h2>
              <div className="mt-6 flex items-end gap-4">
                <span className={cn(
                  "text-6xl font-bold tracking-tighter",
                  result.aigc.score > 50 ? "text-red-400" : result.aigc.score > 20 ? "text-yellow-400" : "text-green-400"
                )}>
                  {result.aigc.score}
                </span>
                <span className="text-gray-400 mb-2">/ 100 危险指数</span>
              </div>
              <p className="text-lg mt-2 font-medium">
                被百度判定为 AI 生成的概率：
                <span className={cn(
                  "ml-2 px-3 py-1 rounded-full text-sm",
                  result.aigc.probability === '极高' ? "bg-red-500/20 text-red-300" : 
                  result.aigc.probability === '中等' ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"
                )}>
                  {result.aigc.probability}
                </span>
              </p>
            </div>

            {/* SEO Card */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-24 h-24" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-6 h-6 text-neon-blue" /> 
                百度 SEO 健康度
              </h2>
              <div className="mt-6 flex items-end gap-4">
                <span className={cn(
                  "text-6xl font-bold tracking-tighter",
                  result.seo.score > 80 ? "text-green-400" : result.seo.score > 50 ? "text-yellow-400" : "text-red-400"
                )}>
                  {result.seo.score}
                </span>
                <span className="text-gray-400 mb-2">/ 100 得分</span>
              </div>
              <p className="text-lg mt-2 text-gray-300 font-medium truncate" title={result.title}>
                页面标题: <span className="text-white">{result.title}</span>
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AIGC Details */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-neon-pink flex items-center gap-2 border-b border-white/10 pb-4">
                AI 降权风险点分析
              </h3>
              
              <div className="space-y-4">
                {result.aigc.structureWarning && (
                  <div className="flex gap-3 text-yellow-300 bg-yellow-500/10 p-4 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-semibold">行文结构机械度高 (低突发性)</p>
                      <p className="text-sm opacity-80 mt-1">系统检测到句子长度分布过于均匀。AI写作往往缺乏人类行文的跳跃性和长短句交错。建议打散段落，增加口语化短句，加入主观感悟。</p>
                    </div>
                  </div>
                )}
                
                {result.aigc.phrasesFound.length > 0 ? (
                  <div className="flex gap-3 text-red-300 bg-red-500/10 p-4 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="w-full">
                      <p className="font-semibold">发现高频 AI 话术特征</p>
                      <p className="text-sm opacity-80 mt-1 mb-3">这些词汇在大量 AI 生成的垃圾文章中频繁出现，百度极易据此判定并拒绝收录。请手动替换这些表述：</p>
                      <div className="flex flex-wrap gap-2">
                        {result.aigc.phrasesFound.map((phrase: string, idx: number) => (
                          <span key={idx} className="bg-red-500/20 px-2 py-1 rounded text-sm font-mono">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 text-green-300 bg-green-500/10 p-4 rounded-xl">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p>未发现明显的机器生成词汇特征。</p>
                  </div>
                )}
              </div>
            </div>

            {/* SEO Details */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-neon-blue flex items-center gap-2 border-b border-white/10 pb-4">
                算法合规检查
              </h3>
              
              <div className="space-y-4">
                {/* 飓风/劲风算法 */}
                <div>
                  <h4 className="text-gray-400 font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> 飓风算法 / 劲风算法 (内容与聚合页)
                  </h4>
                  {result.seo.contentIssues.length > 0 ? (
                    <ul className="space-y-2">
                      {result.seo.contentIssues.map((issue: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-red-300 text-sm bg-red-500/5 p-3 rounded-lg">
                          <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex gap-2 text-green-300 text-sm bg-green-500/5 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> 正文长度 ({result.textLength} 字) 及代码文本比 ({result.textToHtmlRatio}) 合格，未触发垃圾页面红线。
                    </div>
                  )}
                </div>

                {/* 清风算法 */}
                <div>
                  <h4 className="text-gray-400 font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> 清风算法 (标题作弊)
                  </h4>
                  {result.seo.titleIssues.length > 0 ? (
                    <ul className="space-y-2">
                      {result.seo.titleIssues.map((issue: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-red-300 text-sm bg-red-500/5 p-3 rounded-lg">
                          <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex gap-2 text-green-300 text-sm bg-green-500/5 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> 标题长度规范，未发现明显关键词堆砌。
                    </div>
                  )}
                </div>

                {/* 冰桶算法 */}
                <div>
                  <h4 className="text-gray-400 font-medium mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> 冰桶算法 (移动端体验)
                  </h4>
                  {result.seo.mobileIssues.length > 0 ? (
                    <ul className="space-y-2">
                      {result.seo.mobileIssues.map((issue: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-red-300 text-sm bg-red-500/5 p-3 rounded-lg">
                          <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex gap-2 text-green-300 text-sm bg-green-500/5 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> 具备 Viewport 标签，基础移动端适配合格。
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
