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

const SYSTEM_PROMPT = `
သင်သည် "YBS Guide AI" ဖြစ်ပါသည်။
သင်၏တာဝန်မှာ ရန်ကုန်မြို့ YBS ဘတ်စ်လမ်းကြောင်းများကို
မြန်မာပြည်သူများ နားလည်လွယ်အောင် ကူညီရှင်းပြပေးရန် ဖြစ်ပါသည်။

စည်းကမ်းများ –
- အဖြေများကို မြန်မာဘာသာဖြင့်သာ ပြန်ပါ (မူလအတိုင်း)
- စာကြမ်း၊ နည်းပညာဆိုင်ရာ စကားလုံးများ မသုံးပါ
- အဆင့်လိုက်၊ လွယ်ကူစွာ ရှင်းပြပါ
- ဘတ်စ်အမှတ်၊ မှတ်တိုင်အမည်များကို ထင်ရှားစွာ ဖော်ပြပါ
- မသေချာသော အချက်အလက်ကို မခန့်မှန်းပါနှင့်
- Google Maps မညွှန်းပါနှင့်
`;

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
  const prompt = `${SYSTEM_PROMPT}

အသုံးပြုသူ၏ ခရီးစဉ်ကို အောက်ပါအချက်အလက်အပေါ် မူတည်ပြီး
YBS ဘတ်စ်လမ်းကြောင်း အကြံပြုပါ။

လိုအပ်ချက် –
- မူလနေရာ: ${from}
- ဦးတည်ရာ: ${to}
- ဘတ်စ်ပြောင်းရမလား / မပြောင်းရလား
- ဘယ်မှတ်တိုင်မှာ စီး / ဆင်းရမလဲ

အဖြေကို အောက်ပါပုံစံနဲ့ ပြန်ပါ –
1 ဘယ်ဘတ်စ်ကို စီးရမလဲ
2 ဘယ်မှတ်တိုင်မှာ စီးရမလဲ
3 ဘယ်မှတ်တိုင်မှာ ဆင်းရမလဲ
4 ဘတ်စ်ပြောင်းရမယ်ဆိုရင် ဘယ်မှာ ပြောင်းရမလဲ
`;

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
  const prompt = `${SYSTEM_PROMPT}

အသုံးပြုသူသည် YBS ဘတ်စ်ကို မစီးဖူးသေးသော သူများဖြစ်ပါသည်။
ကလေးကို သင်ပေးသလို လွယ်ကူစွာ ရှင်းပြပါ။

- စာကြမ်းမသုံးပါ
- စာကြောင်းတိုတို အသုံးပြုပါ
- အဆင့်လိုက် နံပါတ်နဲ့ ရှင်းပြပါ

Bus Context:\n${context}\n\nCurrent Weather: ${weather}\n\nUser Question: ${message}
`;

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
  const prompt = `${SYSTEM_PROMPT}

Based on this weather data: "${weather}". Provide a transit advisory.

1.please prepare accordingly for your trip. If it is sunny, remember to bring a small towel, a hat, or sunglasses to stay comfortable in the heat. If it is rainy or cloudy, carrying an umbrella is highly recommended.
2. Warn passengers to be careful of pickpockets and thieves on the bus, especially during crowded times.
3. Remind passengers that they may fall asleep on the bus and give advice on how not to miss their bus stop.
4. Provide 2 proactive tips for YBS card users, including topping up in advance, checking balance regularly.
5. 3. Add a romantic or surprise idea for users.
   Entire response MUST be written in BOTH Myanmar and English.
   NO MARKDOWN symbols like ** or ##.
   Use plain text only.
`;

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