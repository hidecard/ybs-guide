import { YBS_ROUTES } from "../data/busData";

declare const puter: any;

interface WeatherData {
  current_condition: Array<{
    temp_C: string;
    weatherDesc: Array<{ value: string }>;
  }>;
}

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

export const getWeatherData = async (): Promise<string> => {
  try {
    const response = await fetch('https://wttr.in/Yangon?format=j1');
    const data: WeatherData = await response.json();
    const temp = data.current_condition[0].temp_C;
    const desc = data.current_condition[0].weatherDesc[0].value;
    return `Current weather in Yangon: ${desc}, ${temp}°C`;
  } catch (error) {
    return "Weather data unavailable.";
  }
};

export const getAIRouteSuggestion = async (from: string, to: string) => {
  const context = getBusDataContext();
  const prompt = `User wants to go from "${from}" to "${to}". Suggest the best bus number(s).
  - ALWAYS provide the answer in BOTH Myanmar language and English.
  - DO NOT USE markdown symbols like ** or ##. Use plain text only.`;

  try {
    const response = await puter.ai.chat(context + "\n\n" + prompt, { model: 'gemini-3-flash-preview', stream: true });
    let fullResponse = "";
    for await (const part of response) {
      if (part?.text) {
        fullResponse += part.text;
      }
    }
    return cleanText(fullResponse || "");
  } catch (error) {
    return "AI ဝန်ဆောင်မှု မရနိုင်သေးပါ။ / AI service is currently unavailable.";
  }
};

export const chatWithAI = async (message: string) => {
  const context = getBusDataContext();
  const weather = await getWeatherData();
  const prompt = `Bus Context:\n${context}\n\nCurrent Weather: ${weather}\n\nUser Question: ${message}\n\nInstructions: You are YBS Nova. Answer accurately. DO NOT use markdown characters like ** or ###. ALWAYS provide answers in BOTH Myanmar and English. Be proactive: if the weather is rainy, remind about umbrellas. Provide helpful YBS card top-up and balance check tips (USSD, App, G&G outlets) whenever relevant.`;

  try {
    const response = await puter.ai.chat(prompt, { model: 'gemini-3-flash-preview', stream: true });
    let fullResponse = "";
    for await (const part of response) {
      if (part?.text) {
        fullResponse += part.text;
      }
    }
    return cleanText(fullResponse || "");
  } catch (error) {
    return "အမှားအယွင်းရှိနေပါသည်။ / System error.";
  }
};

export const getDiscoveryInfo = async () => {
  const weather = await getWeatherData();
  const prompt = `Based on this weather data: "${weather}". Provide a transit advisory. 1. Describe current weather and suggest an umbrella if rainy/cloudy. 2. Provide 3 proactive tips for YBS card users (top-up, balance check, tapping rule). Entire response MUST be in BOTH Myanmar and English. NO MARKDOWN SYMBOLS like ** or ##. Use plain text only.`;
  try {
    const response = await puter.ai.chat(prompt, { model: 'gemini-3-flash-preview', stream: true });
    let fullResponse = "";
    for await (const part of response) {
      if (part?.text) {
        fullResponse += part.text;
      }
    }
    return cleanText(fullResponse || "");
  } catch (error) {
    return "Discovery info unavailable. / အချက်အလက်များ မရနိုင်ပါ။";
  }
};

