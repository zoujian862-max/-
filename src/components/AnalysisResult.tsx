import React, { useState } from "react";
import { AnalysisResult } from "@/src/services/geminiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, ShieldAlert, BookOpen, MessageSquareText, Share2, Download, Copy, Check, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AnalysisResultProps {
  result: AnalysisResult;
  onShare?: () => void;
}

export default function AnalysisResultView({ result, onShare }: AnalysisResultProps) {
  const [copied, setCopied] = useState(false);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "text-destructive";
      case "medium": return "text-orange-500";
      case "low": return "text-green-500";
      default: return "text-slate-500";
    }
  };

  const getRiskScore = (level: string) => {
    switch (level) {
      case "high": return 85;
      case "medium": return 45;
      case "low": return 15;
      default: return 0;
    }
  };

  const handleCopy = () => {
    const text = `合同风险分析报告\n总体评估: ${result.summary}\n风险等级: ${result.overallRisk}\n风险点: ${result.traps.map(t => t.title).join(", ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to render highlighted text with interactive popovers
  const renderHighlightedText = () => {
    if (!result.highlightedText) return null;

    const parts = result.highlightedText.split(/(\[RISK:\d+\].*?\[\/RISK\])/g);
    
    return parts.map((part, i) => {
      const match = part.match(/\[RISK:(\d+)\](.*?)\[\/RISK\]/);
      if (match) {
        const index = parseInt(match[1]);
        const trap = result.traps[index];
        const content = match[2];
        
        if (!trap) return content;

        return (
          <Popover key={i}>
            <PopoverTrigger className={`highlight-risk cursor-pointer hover:opacity-80 transition-opacity ${index % 2 === 0 ? 'bg-red-100 border-red-500' : 'bg-orange-100 border-orange-500'}`}>
              {content}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 z-50">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  {trap.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {trap.description}
                </p>
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">实际影响</div>
                  <p className="text-xs text-destructive font-medium">{trap.impact}</p>
                </div>
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">建议</div>
                  <p className="text-xs text-primary font-medium">{trap.suggestion}</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Action Buttons */}
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm" className="flex-1 h-8 gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "已复制" : "复制简报"}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-8 gap-1.5 text-xs" onClick={onShare}>
          <Share2 className="w-3.5 h-3.5" /> 分享报告
        </Button>
      </div>

      {/* Risk Meter */}
      <div className="risk-meter-card">
        <div className={`meter-value ${getRiskColor(result.overallRisk)}`}>
          {getRiskScore(result.overallRisk)}
        </div>
        <div className="meter-label font-semibold">风险陷阱评分</div>
        <div className={`text-[11px] mt-2 font-medium ${getRiskColor(result.overallRisk)}`}>
          发现 {result.traps.length} 处风险点，建议仔细阅读
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
            <Info className="w-4 h-4 text-primary" /> 总体评估
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-slate-600">{result.summary}</p>
        </CardContent>
      </Card>

      {/* Highlighted Text Card */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
            <FileText className="w-4 h-4 text-primary" /> 风险高亮原文
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs leading-[1.8] text-slate-600 whitespace-pre-wrap font-sans">
            {renderHighlightedText()}
          </div>
          <div className="mt-4 text-[10px] text-slate-400 italic">
            * 点击高亮文字可查看详细风险说明
          </div>
        </CardContent>
      </Card>

      {/* Traps Section */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">风险详情清单</div>
        <div className="space-y-3">
          {result.traps.map((trap, index) => (
            <Card key={index} className="border-none shadow-sm overflow-hidden">
              <div className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm ${index % 2 === 0 ? 'text-destructive' : 'text-orange-500'}`}>
                    {index % 2 === 0 ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{trap.title}</span>
                </div>
                <div className="text-xs leading-relaxed text-slate-600 mb-3">
                  <strong>通俗解释：</strong> {trap.impact}
                </div>
                <div className="text-[11px] font-semibold text-primary">
                  法条参考：{result.legalReferences[index % result.legalReferences.length] || "《民法典》相关条款"}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Plain Language Explanation */}
      <Card className="border-none shadow-sm bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900">
            <MessageSquareText className="w-4 h-4" /> 核心风险讲解
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-blue-800/80">
          <ReactMarkdown>{result.plainExplanation}</ReactMarkdown>
        </CardContent>
      </Card>
      
      <div className="text-center text-[10px] text-slate-400 pt-4">
        * 以上分析由 AI 生成，仅供参考，不构成正式法律建议。
      </div>
    </div>
  );
}
