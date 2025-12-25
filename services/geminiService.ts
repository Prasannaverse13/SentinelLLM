
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const stripMarkdown = (text: string): string => {
  return text
    .replace(/[#*`_~]/g, '') 
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
    .replace(/\n{3,}/g, '\n\n') 
    .trim();
};

export const generateLLMResponse = async (prompt: string) => {
  const startTime = performance.now();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional SRE assistant. Provide responses in strictly PLAIN TEXT. NO Markdown. Just clear, simple paragraphs.",
      }
    });
    const endTime = performance.now();
    let text = response.text || '';
    text = stripMarkdown(text);
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    
    return {
      text,
      latency: Math.round(endTime - startTime),
      tokens: inputTokens + outputTokens,
      promptLength: inputTokens,
      model: 'gemini-3-flash-preview',
      safetyBlocked: !text && !!response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP'
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const checkHallucination = async (prompt: string, response: string) => {
  try {
    if (!response) return { score: 0, explanation: "Empty response" };
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Prompt: ${prompt}\nResponse: ${response}\n\nRate hallucination likelihood from 0-1 and explain briefly.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["score", "explanation"]
        }
      }
    });
    return JSON.parse(res.text || '{"score": 0, "explanation": "N/A"}');
  } catch (error) {
    return { score: 0.1, explanation: "Self-check failed" };
  }
};

export const generateRunSummary = async (data: any[]) => {
  try {
    const summaryData = data.slice(-20).map(d => ({
      lat: d.latency_ms,
      cost: d.cost_usd,
      hall: d.hallucination_score,
      fail: d.prompt_failure
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this SRE telemetry batch: ${JSON.stringify(summaryData)}. Provide an executive summary. PLAIN TEXT. NO MARKDOWN.`,
    });

    return stripMarkdown(response.text || "Insufficient data.");
  } catch (error) {
    return "Fleet analysis timeout.";
  }
};

export const analyzeRootCause = async (incidentTitle: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze incident: "${incidentTitle}". Context: ${context}. Return a JSON object with 'rootCause' and 'runbook' (an array of 3 actionable steps).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.STRING },
            runbook: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["rootCause", "runbook"]
        }
      }
    });
    const result = JSON.parse(response.text || '{}');
    return {
      rootCause: stripMarkdown(result.rootCause),
      runbook: result.runbook.map(stripMarkdown).join('\n')
    };
  } catch (error) {
    return { rootCause: "AI analysis failed.", runbook: "1. Manual investigation required." };
  }
};
