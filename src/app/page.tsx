'use client';

import { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle, Bot, Zap, Smartphone, FileText, Shield, Eye, Code, Award, Activity, Link2, Image as ImageIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple Tab Component
function Tabs({ tabs, activeTab, setActiveTab }: { tabs: string[], activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <div className="flex space-x-2 border-b border-white/10 mb-6 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={cn(
            "px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap",
            activeTab === tab 
              ? "bg-white/10 text-white border-b-2 border-neon-blue" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('概览报表');

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
      setActiveTab('概览报表');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAlgorithmScore = (algos: any) => {
    let score = 100;
    if (!algos.qingfeng.passed) score -= algos.qingfeng.issues.length * 10;
    if (!algos.xiyu.passed) score -= algos.xiyu.issues.length * 15;
    if (!algos.jufeng.passed) score -= algos.jufeng.issues.length * 20;
    if (!algos.bingtong.passed) score -= algos.bingtong.issues.length * 20;
    if (!algos.tianwang.passed) score -= algos.tianwang.issues.length * 30;
    return Math.max(0, score);
  };

  return (
    <main className="min-h-screen p-4 md:p-12 lg:p-24 flex flex-col items-center">
      
      <div className="text-center mb-12 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight glow-text text-white leading-tight">
          百度SEO核心算法 <span className="text-neon-pink">& EEAT</span> 全景体检
        </h1>
        <p className="text-gray-400 text-lg md:text-xl">
          深度模拟 Baiduspider 抓取，全面覆盖清风/飓风/冰桶算法，引入全新 E-E-A-T 质量评估模型
        </p>
      </div>

      <form onSubmit={analyzeUrl} className="w-full max-w-3xl relative mb-12 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex flex-col sm:flex-row items-center glass-panel rounded-3xl sm:rounded-full p-2 pl-6 gap-4 sm:gap-0">
          <Search className="w-6 h-6 text-gray-400 hidden sm:block" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入网页URL (例如: https://example.com/article/1)"
            className="flex-1 w-full sm:w-auto bg-transparent border-none outline-none text-white px-2 sm:px-4 text-lg placeholder:text-gray-600 py-2 sm:py-0"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-neon-blue hover:bg-neon-purple text-black font-semibold rounded-full px-8 py-3 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                分析中...
              </>
            ) : (
              '开始深度诊断'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="glass-panel border-red-500/50 bg-red-500/10 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 mb-8 w-full max-w-4xl">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <Tabs 
            tabs={['概览报表', '百度算法排查', 'E-E-A-T 质量评估', '百度蜘蛛视觉 (Baiduspider)']} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />

          <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* TAB: 概览报表 */}
            {activeTab === '概览报表' && (
              <div className="space-y-8 relative z-10">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2 truncate" title={result.title}>{result.title || '无标题'}</h2>
                  <p className="text-gray-400 truncate hover:text-neon-blue transition-colors">
                    <a href={result.url} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                      <Link2 className="w-4 h-4" /> {result.url}
                    </a>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* SEO Score */}
                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Zap className="w-32 h-32" />
                    </div>
                    <h3 className="text-lg text-gray-400 font-medium mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-neon-blue" /> 百度基础SEO评分
                    </h3>
                    <div className="flex items-end gap-3">
                      <span className={cn(
                        "text-6xl font-bold tracking-tighter",
                        getAlgorithmScore(result.algorithms) > 80 ? "text-green-400" : getAlgorithmScore(result.algorithms) > 50 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {getAlgorithmScore(result.algorithms)}
                      </span>
                      <span className="text-gray-500 mb-2">/ 100</span>
                    </div>
                  </div>

                  {/* EEAT Score */}
                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Award className="w-32 h-32" />
                    </div>
                    <h3 className="text-lg text-gray-400 font-medium mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-400" /> 质量评估 (EEAT)
                    </h3>
                    <div className="flex items-end gap-3">
                      <span className={cn(
                        "text-6xl font-bold tracking-tighter",
                        result.eeat.score > 80 ? "text-green-400" : result.eeat.score > 50 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {result.eeat.score}
                      </span>
                      <span className="text-gray-500 mb-2">/ 100</span>
                    </div>
                  </div>

                  {/* AIGC Score */}
                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Bot className="w-32 h-32" />
                    </div>
                    <h3 className="text-lg text-gray-400 font-medium mb-4 flex items-center gap-2">
                      <Bot className="w-5 h-5 text-neon-pink" /> AI痕迹指数
                    </h3>
                    <div className="flex items-end gap-3">
                      <span className={cn(
                        "text-6xl font-bold tracking-tighter",
                        result.aigc.score > 60 ? "text-red-400" : result.aigc.score > 30 ? "text-yellow-400" : "text-green-400"
                      )}>
                        {result.aigc.score}
                      </span>
                      <span className="text-gray-500 mb-2">/ 100</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      降权风险：<span className={cn(
                        result.aigc.probability === '极高风险' ? 'text-red-400' : result.aigc.probability === '中等风险' ? 'text-yellow-400' : 'text-green-400'
                      )}>{result.aigc.probability}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: 百度算法排查 */}
            {activeTab === '百度算法排查' && (
              <div className="space-y-6 relative z-10">
                <div className="bg-neon-blue/10 border border-neon-blue/30 text-neon-blue px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-3">
                  <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>百度近年来推出了多项搜索质量算法，如果触及以下红线，可能会导致页面被降权甚至整站被K（从索引库中剔除）。以下是为您页面的详细体检报告：</p>
                </div>

                {Object.entries(result.algorithms).map(([key, algo]: [string, any]) => {
                  const names: Record<string, string> = {
                    qingfeng: '清风算法 (标题规范)',
                    xiyu: '细雨算法 (B2B/内容规范)',
                    jufeng: '飓风/劲风算法 (内容质量)',
                    bingtong: '冰桶/石榴算法 (移动体验/广告)',
                    tianwang: '天网算法 (用户权限限制)'
                  };
                  return (
                    <div key={key} className="bg-black/40 rounded-2xl p-6 border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {algo.passed ? <CheckCircle className="w-6 h-6 text-green-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />}
                          {names[key] || key}
                        </h3>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold",
                          algo.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {algo.passed ? '未触发违规' : '存在严重风险'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 border-b border-white/10 pb-4">{algo.desc}</p>
                      
                      {!algo.passed && (
                        <ul className="space-y-3">
                          {algo.issues.map((issue: string, idx: number) => (
                            <li key={idx} className="flex gap-3 text-red-300 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                              <XCircle className="w-5 h-5 shrink-0 text-red-500" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB: E-E-A-T 质量评估 */}
            {activeTab === 'E-E-A-T 质量评估' && (
              <div className="space-y-6 relative z-10">
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-3">
                  <Award className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>在 AI 时代，搜索引擎越来越看重 E-E-A-T（经验、专业、权威、可信）。高质量的原创内容应当具备第一人称真实经验，明确的作者背书，以及安全可信赖的网页环境。</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(result.eeat.breakdown).map(([key, item]: [string, any]) => {
                    const titles: Record<string, any> = {
                      experience: { title: 'Experience (真实经验)', icon: <Activity className="w-5 h-5" />, color: 'text-blue-400' },
                      expertise: { title: 'Expertise (专业度)', icon: <Code className="w-5 h-5" />, color: 'text-purple-400' },
                      authoritativeness: { title: 'Authoritativeness (权威性)', icon: <Award className="w-5 h-5" />, color: 'text-yellow-400' },
                      trustworthiness: { title: 'Trustworthiness (可信度)', icon: <Shield className="w-5 h-5" />, color: 'text-green-400' }
                    };
                    const info = titles[key];
                    return (
                      <div key={key} className="bg-black/40 rounded-2xl p-6 border border-white/5 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className={cn("text-lg font-bold flex items-center gap-2", info.color)}>
                            {info.icon} {info.title}
                          </h3>
                          <span className="text-2xl font-bold">{item.score}<span className="text-sm text-gray-500 font-normal">/{item.max}</span></span>
                        </div>
                        <ul className="space-y-2 flex-1">
                          {item.factors.map((factor: string, idx: number) => {
                            const isPositive = factor.includes('+') || factor.includes('规范');
                            return (
                              <li key={idx} className={cn(
                                "text-sm p-3 rounded-lg border",
                                isPositive ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-gray-800/50 border-gray-700 text-gray-400"
                              )}>
                                {factor}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: 百度蜘蛛视觉 */}
            {activeTab === '百度蜘蛛视觉 (Baiduspider)' && (
              <div className="space-y-6 relative z-10">
                <div className="bg-neon-purple/10 border border-neon-purple/30 text-neon-purple px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-3">
                  <Eye className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">这就是百度基础蜘蛛看到的你的网页！</p>
                    <p className="opacity-80">注意：基础搜索引擎爬虫（Baiduspider）**不执行 JavaScript**。如果你使用的是 Vue/React 的纯客户端渲染（无 SSR），蜘蛛看到的将是一片空白（空壳）。以下内容已剥离所有样式、脚本和无关标签。</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-gray-400 text-sm mb-1">提取纯文本长度</p>
                    <p className="text-2xl font-bold text-white">{result.spiderVision.textLength} <span className="text-xs text-gray-500">字</span></p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-gray-400 text-sm mb-1">文本代码比</p>
                    <p className="text-2xl font-bold text-white">{result.spiderVision.textToHtmlRatio}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-gray-400 text-sm mb-1">外部链接数量</p>
                    <p className="text-2xl font-bold text-white">{result.spiderVision.outLinksCount} <span className="text-xs text-gray-500">个</span></p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-gray-400 text-sm mb-1">缺少Alt的图片</p>
                    <p className={cn("text-2xl font-bold", result.spiderVision.imagesWithoutAlt > 0 ? "text-red-400" : "text-white")}>
                      {result.spiderVision.imagesWithoutAlt} <span className="text-xs text-gray-500">/ {result.spiderVision.imagesCount}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/60 rounded-xl border border-white/10 overflow-hidden">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">页面核心标签</span>
                    </div>
                    <div className="p-4 space-y-4 text-sm">
                      <div>
                        <span className="text-blue-400 font-mono">{'<title>'}</span>
                        <p className="text-white mt-1 bg-white/5 p-2 rounded">{result.title || '无'}</p>
                      </div>
                      <div>
                        <span className="text-green-400 font-mono">{'<meta name="description">'}</span>
                        <p className="text-white mt-1 bg-white/5 p-2 rounded">{result.meta.description || '无'}</p>
                      </div>
                      <div>
                        <span className="text-yellow-400 font-mono">{'<h1>'} 标签 (页面核心主题)</span>
                        {result.spiderVision.h1.length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {result.spiderVision.h1.map((h: string, i: number) => (
                              <li key={i} className="text-white bg-white/5 p-2 rounded">{h}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-red-400 mt-1 bg-red-500/10 p-2 rounded border border-red-500/20">严重问题：页面缺少 H1 标签</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/60 rounded-xl border border-white/10 overflow-hidden">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">纯净文本视图 (Baiduspider 抓取物)</span>
                    </div>
                    <div className="p-4">
                      {result.spiderVision.rawText.length > 0 ? (
                        <pre className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap font-mono h-96 overflow-y-auto custom-scrollbar p-2">
                          {result.spiderVision.rawText}
                        </pre>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-red-400">
                          <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                          <p className="font-bold">蜘蛛抓取到的文本为空！</p>
                          <p className="text-sm mt-2">原因可能是该页面重度依赖客户端渲染(CSR)，请考虑使用 Next.js 的 SSR 渲染模式以利于 SEO。</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </main>
  );
}
