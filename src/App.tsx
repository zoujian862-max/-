/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { analyzeContract, AnalysisResult } from "./services/geminiService";
import AnalysisResultView from "./components/AnalysisResult";
import { 
  ShieldCheck, 
  FileText, 
  Loader2, 
  Search, 
  History, 
  Trash2, 
  Home, 
  Briefcase, 
  Building2, 
  CreditCard, 
  Clock, 
  Camera, 
  Upload, 
  X,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function App() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; title: string; result: AnalysisResult; date: string }[]>([]);
  const [activeNav, setActiveNav] = useState("insurance");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!text.trim() && !file) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      let filePart;
      if (file) {
        const base64 = await fileToBase64(file);
        filePart = {
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        };
      }

      const contractTypesMap: Record<string, string> = {
        insurance: "商业保险合同",
        labor: "劳动聘用合同",
        rent: "房屋租赁合同",
        finance: "贷款金融协议",
        ip: "知识产权协议",
        equity: "股权转让协议",
        divorce: "离婚协议书",
        realestate: "购房/装修合同",
        privacy: "隐私/用户协议",
      };

      const analysisResult = await analyzeContract(text, filePart, contractTypesMap[activeNav]);
      setResult(analysisResult);
      
      const title = file ? `[文件] ${file.name}` : (text.slice(0, 30) + (text.length > 30 ? "..." : ""));
      const newHistoryItem = {
        id: Date.now().toString(),
        title,
        result: analysisResult,
        date: new Date().toLocaleString(),
      };
      setHistory([newHistoryItem, ...history.slice(0, 9)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析过程中出现错误");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearHistory = () => setHistory([]);
  const loadFromHistory = (item: typeof history[0]) => setResult(item.result);

  const handleShare = () => {
    if (!result) return;
    const shareUrl = window.location.href;
    const shareText = `【合同卫士】我正在使用 AI 分析合同风险，发现该合同风险等级为：${result.overallRisk === 'high' ? '高' : result.overallRisk === 'medium' ? '中' : '低'}。推荐你也试试：${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: '合同风险分析报告',
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText);
      alert("分享链接已复制到剪贴板！");
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f4f7fa] text-[#334155] font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center px-6 justify-between shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center text-white font-bold text-lg">
            ⚖
          </div>
          <span className="text-xl font-bold text-[#1e40af]">合同卫士 LegalGuard AI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] px-2 py-1 rounded-full bg-[#dcfce7] text-[#166534] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse" />
            AI 模型已就绪
          </span>
          <div className="w-8 h-8 rounded-full bg-[#e2e8f0]" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Left */}
        <aside className="w-[260px] bg-white border-r border-[#e2e8f0] p-5 flex flex-col shrink-0 overflow-y-auto">
          <div className="text-[12px] uppercase text-[#64748b] font-bold tracking-wider mb-4">分析类型</div>
          <nav className="space-y-1 mb-8">
            {[
              { id: "insurance", icon: Home, label: "商业保险合同" },
              { id: "labor", icon: Briefcase, label: "劳动聘用合同" },
              { id: "rent", icon: Building2, label: "房屋租赁合同" },
              { id: "finance", icon: CreditCard, label: "贷款金融协议" },
              { id: "ip", icon: ShieldCheck, label: "知识产权协议" },
              { id: "equity", icon: CreditCard, label: "股权转让协议" },
              { id: "divorce", icon: FileText, label: "离婚协议书" },
              { id: "realestate", icon: Building2, label: "购房/装修合同" },
              { id: "privacy", icon: ShieldCheck, label: "隐私/用户协议" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeNav === item.id ? "bg-[#eff6ff] text-[#2563eb] font-bold" : "hover:bg-[#f1f5f9]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center justify-between mb-4">
            <div className="text-[12px] uppercase text-[#64748b] font-bold tracking-wider">最近记录</div>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-[10px] text-slate-400 hover:text-destructive">
                清空
              </button>
            )}
          </div>
          <ScrollArea className="flex-1 -mx-2 px-2">
            {history.length > 0 ? (
              <div className="space-y-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-[#f1f5f9] transition-colors truncate"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[11px] text-slate-400">暂无记录</p>
              </div>
            )}
          </ScrollArea>
        </aside>

        {/* Main Content (Doc Viewer) */}
        <main className="flex-1 p-6 overflow-y-auto bg-white m-4 rounded-xl border border-[#e2e8f0] shadow-inner flex flex-col relative">
          <div className="mb-5 pb-4 border-b-2 border-[#f1f5f9] shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0f172a]">文档分析与风险识别</h2>
              <p className="text-[12px] text-[#94a3b8] mt-1">请输入文本、上传文件或拍照进行分析</p>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                capture="environment"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-8 gap-1.5 border-[#e2e8f0]"
              >
                <Upload className="w-3.5 h-3.5" /> 上传文件
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="text-xs h-8 gap-1.5 border-[#e2e8f0]"
              >
                <Camera className="w-3.5 h-3.5" /> 拍照识别
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0">
            {file && (
              <div className="mb-4 p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  {filePreview ? (
                    <img src={filePreview} className="w-10 h-10 rounded object-cover border border-[#e2e8f0]" alt="Preview" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8 text-slate-400 hover:text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Textarea
              placeholder="在此粘贴文本内容，或直接上传/拍摄合同文件..."
              className="flex-1 border-none focus-visible:ring-0 resize-none p-0 text-sm leading-[1.8] text-[#475569] placeholder:text-slate-300"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div className="pt-4 border-t border-[#f1f5f9] flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-400">
                {text.length > 0 ? `已输入 ${text.length} 个字符` : (file ? "已准备好分析文件" : "等待输入...")}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setText(""); removeFile(); }}
                  disabled={(!text && !file) || isAnalyzing}
                  className="text-xs h-9 px-4"
                >
                  清空
                </Button>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={(!text.trim() && !file) || isAnalyzing}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs h-9 px-6 font-bold rounded-lg shadow-sm"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "开始分析"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
              {error}
            </div>
          )}
        </main>

        {/* Sidebar Right (Analysis) */}
        <aside className="w-[320px] bg-[#f8fafc] border-l border-[#e2e8f0] p-5 overflow-y-auto shrink-0">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <AnalysisResultView result={result} onShare={handleShare} />
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-[#e2e8f0]">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-[#0f172a]">等待分析</h3>
                <p className="text-[11px] text-[#64748b] mt-2 max-w-[180px]">
                  在左侧输入合同内容并点击“开始分析”按钮，AI 将为您深度解析。
                </p>
              </div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
