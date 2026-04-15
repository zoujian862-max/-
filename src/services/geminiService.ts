import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisSection {
  title: string;
  content: string;
  riskLevel: "low" | "medium" | "high";
}

export interface AnalysisResult {
  summary: string;
  overallRisk: "low" | "medium" | "high";
  traps: {
    title: string;
    description: string;
    impact: string;
    suggestion: string;
    originalText?: string; // The text snippet from the contract that is risky
  }[];
  plainExplanation: string;
  legalReferences: string[];
  highlightedText: string; // The full contract text with markers like [RISK:index]...[/RISK]
}

export interface MultimodalPart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export async function analyzeContract(
  text: string, 
  filePart?: MultimodalPart,
  contractType: string = "通用合同"
): Promise<AnalysisResult> {
  const systemInstruction = `
    你是一个资深的法律专家和保险精算师。请分析提供的${contractType}（可能是文本、图片或PDF），识别其中的风险陷阱、不公平条款以及潜在的法律漏洞。
    
    分析要求：
    1. 识别具体的“陷阱”或高风险点。
    2. 用通俗易懂的语言解释这些条款对普通人的实际影响。
    3. 提供相关的法律参考（如《民法典》、《保险法》、《劳动法》等相关条款）。
    4. 给出专业的建议。
    5. **高亮显示**：在返回的 highlightedText 字段中，返回完整的合同文本（如果是图片/PDF，请先OCR识别），并在识别到的风险点前后加上标记，格式为 [RISK:索引]风险文本[/RISK]，其中索引对应 traps 数组的下标。
  `;

  const prompt = text || "请分析这个合同文件中的风险。";
  
  const contents: any[] = [];
  if (filePart) {
    contents.push({ parts: [filePart, { text: prompt }] });
  } else {
    contents.push({ parts: [{ text: prompt }] });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          overallRisk: { type: Type.STRING, enum: ["low", "medium", "high"] },
          traps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impact: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                originalText: { type: Type.STRING },
              },
              required: ["title", "description", "impact", "suggestion", "originalText"],
            },
          },
          plainExplanation: { type: Type.STRING },
          legalReferences: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          highlightedText: { type: Type.STRING },
        },
        required: ["summary", "overallRisk", "traps", "plainExplanation", "legalReferences", "highlightedText"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("分析失败，请稍后重试。");
  }
}
