
import { GoogleGenAI } from "@google/genai";
import { YBS_ROUTES } from "../data/busData";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility to strip markdown symbols that clutter the UI
 */
export const cleanText = (text: string) => {
  return text
    .replace(/\*\*/g, '') 
    .replace(/\*/g, '')   
    .replace(/###/g, '')  
    .replace(/##/g, '')   
    .replace(/#/g, '')    
    .replace(/`/g, '')    
    .replace(/__/g, '')   
    .trim();
};

const getBusDataContext = () => {
  return `The following is a list of YBS routes:
${YBS_ROUTES.map(r => `Bus ${r.id}: ${r.stops.join(" - ")}`).join("\n")}`;
};

export const getAIRouteSuggestion = async (from: string, to: string) => {
  const context = getBusDataContext();
  const prompt = `User wants to go from "${from}" to "${to}". Suggest the best bus number(s). 
  - ALWAYS provide the answer in BOTH Myanmar language and English.
  - DO NOT USE markdown symbols like ** or ##. Use plain text only.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context + "\n\n" + prompt,
    });
    return cleanText(response.text || "");
  } catch (error) {
    return "AI ဝန်ဆောင်မှု မရနိုင်သေးပါ။ / AI service is currently unavailable.";
  }
};

export const chatWithAI = async (message: string) => {
  const context = getBusDataContext();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bus Context:\n${context}\n\nUser Question: ${message}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are YBS Nova. Answer accurately. DO NOT use markdown characters like ** or ###. ALWAYS provide answers in BOTH Myanmar and English. Be proactive: if the weather is mentioned or detected as rainy, remind about umbrellas. Provide helpful YBS card top-up and balance check tips (USSD, App, G&G outlets) whenever relevant."
      }
    });
    return cleanText(response.text || "");
  } catch (error) {
    return "အမှားအယွင်းရှိနေပါသည်။ / System error.";
  }
};

export const getDiscoveryInfo = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Proactively check Yangon weather and provide a transit advisory. 1. Describe current weather and suggest an umbrella if rainy/cloudy. 2. Provide 3 proactive tips for YBS card users (top-up, balance check, tapping rule). Entire response MUST be in BOTH Myanmar and English. NO MARKDOWN SYMBOLS like ** or ##. Use plain text only.",
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    return cleanText(response.text || "");
  } catch (error) {
    return "Discovery info unavailable. / အချက်အလက်များ မရနိုင်ပါ။";
  }
};
