import React, { useState } from 'react';

interface GuideSection {
  titleEn: string;
  titleMm: string;
  contentEn: string;
  contentMm: string;
}

interface FAQItem {
  questionEn: string;
  questionMm: string;
  answerEn: string;
  answerMm: string;
}

const CardGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [language, setLanguage] = useState<'en' | 'mm'>('en');

  const guideSections: GuideSection[] = [
    {
      titleEn: '1. Getting Your YBS Card',
      titleMm: '၁။ YBS ကတ်ရယူခြင်း',
      contentEn: 'YBS cards are available at major bus terminals, convenience stores, and authorized dealers throughout Yangon. Look for the "YBS Card Available" sign. You can purchase cards for 1,000 MMK with no initial balance.',
      contentMm: 'YBS ကတ်များကို ရန်ကုန်မြို့တစ်ဝှမ်းရှိ ဘတ်စ်ကားဂိတ်များ၊ စတိုးဆိုင်များနှင့် တရားဝင်ရောင်းချရေးနေရာများတွင် ဝယ်ယူနိုင်ပါသည်။ "YBS Card Available" ဆိုင်းဘုတ်ကို ရှာဖွေပါ။ ကတ်တစ်ခုကို ၁၀၀၀ ကျပ်ဖြင့် ဝယ်ယူနိုင်ပြီး ကနဦးငွေများ မရှိပါ။',
    },
    {
      titleEn: '2. Topping Up Your Card',
      titleMm: '၂။ ကတ်သို့ ငွေဖြည့်ခြင်း',
      contentEn: 'You can top up your card at bus terminals, convenience stores, or through mobile payment apps. Minimum top-up amount is usually 500 MMK. Keep your receipt as proof of transaction.',
      contentMm: 'ဘတ်စ်ကားဂိတ်များ၊ စတိုးဆိုင်များ သို့မဟုတ် မိုဘိုင်းငွေပေးချေမှုအက်ပ်များမှတဆင့် ငွေဖြည့်နိုင်ပါသည်။ အနည်းဆုံးငွေဖြည့်မှုမှာ ၅၀၀ ကျပ်ဖြစ်ပါသည်။ ငွေလွှဲမှတ်တမ်းအဖြစ် ပြေစာကို သိမ်းထားပါ။',
    },
    {
      titleEn: '3. Using Your Card on the Bus',
      titleMm: '၃။ ဘတ်စ်ကားပေါ်တွင် ကတ်အသုံးပြုခြင်း',
      contentEn: 'When boarding, tap your card on the card reader near the entrance. You will hear a beep and see your remaining balance. If your balance is insufficient, the reader will alert you. Remember to tap again when you exit (if required on that route).',
      contentMm: 'ဘတ်စ်ကားပေါ်တက်သောအခါ၊ ဝင်ပေါက်အနီးရှိ ကတ်ဖတ်စက်ပေါ်တွင် ကတ်ကို ထိပါ။ သင်သည် အသံကြားရမည်ဆိုပြီး ကျန်ရှိငွေပမာဏကို မြင်ရမည်ဖြစ်သည်။ သင့်ငွေလုံလောက်ခြင်းမရှိပါက၊ ဖတ်စက်က သတိပေးမည်ဖြစ်သည်။ ဆင်းရန်အခါ တစ်ဖန် ထိရန် မမေ့ပါနှင့် (လမ်းကြောင်းအလိုက် လိုအပ်ပါက)။',
    },
    {
      titleEn: '4. Checking Your Balance',
      titleMm: '၄။ လက်ကျန်ငွေကြည့်ခြင်း',
      contentEn: 'Check your balance on the bus reader when you tap, at top-up stations, or using this app\'s NFC feature (if your phone supports NFC). You can also manually track your balance in this Card Companion.',
      contentMm: 'ကတ်ထိသောအခါ ဘတ်စ်ကားဖတ်စက်၊ ငွေဖြည့်စခန်းများတွင် သို့မဟုတ် ဤအက်ပ်၏ NFC လုပ်ဆောင်ချက်ကို အသုံးပြု၍ (သင့်ဖုန်းက NFC ကို ပံ့ပိုးထားပါက) လက်ကျန်ငွေကို စစ်ဆေးနိုင်ပါသည်။ ဤ Card Companion တွင်လည်း လက်ဖြင့် မှတ်တမ်းတင်နိုင်ပါသည်။',
    },
    {
      titleEn: '5. Card Maintenance',
      titleMm: '၅။ ကတ်ထိန်းသိမ်းခြင်း',
      contentEn: 'Keep your card away from magnetic fields and extreme temperatures. Do not bend or damage the card. If lost or damaged, report to YBS customer service. Balances can usually be transferred to a new card with proof of ownership.',
      contentMm: 'သင့်ကတ်ကို သံလိုက်စက်ကွင်းများနှင့် အပူချိန်အလွန်အကျွံများနှင့် ဝေးရာတွင် ထားပါ။ ကတ်ကို မကွေးမညွတ်စေပါနှင့်။ ပျောက်ဆုံးခြင်း သို့မဟုတ် ပျက်စီးခြင်းရှိပါက YBS ဖောက်သည်ဝန်ဆောင်မှုသို့ အစီရင်ခံပါ။ ပိုင်ဆိုင်မှု အထောက်အထားဖြင့် ကတ်သစ်သို့ ငွေလက်ကျန်များကို လွှဲပြောင်းနိုင်ပါသည်။',
    },
  ];

  const faqs: FAQItem[] = [
    {
      questionEn: 'What types of YBS cards are available?',
      questionMm: 'YBS ကတ် အမျိုးအစားများ ရှိပါသလား?',
      answerEn: 'There are standard cards for general public, student cards with discounts, and senior citizen cards. Each type has different fare rates.',
      answerMm: 'အများပြည်သူအတွက် စံကတ်များ၊ လျှော့စျေးပါသော ကျောင်းသားကတ်များနှင့် အသက်အရွယ်ကြီးရင့်သူကတ်များ ရှိပါသည်။ အမျိုးအစားတစ်ခုစီတွင် မတူညီသော ခရီးစရိတ်နှုန်းထားများ ရှိပါသည်။',
    },
    {
      questionEn: 'How much does a bus ride cost?',
      questionMm: 'ဘတ်စ်ကားစီးခ ဘယ်လောက်ကျသလဲ?',
      answerEn: 'Fares vary by distance: short trips (up to 5 stops) typically cost 200 MMK, medium trips 300 MMK, and long-distance routes 400-500 MMK.',
      answerMm: 'ခရီးစရိတ်သည် အကွာအဝေးအလိုက် ကွဲပြားသည်- တိုတောင်းသောခရီးများ (ရပ်နား ၅ ခုအထိ) သည် ပုံမှန်အားဖြင့် ၂၀၀ ကျပ်၊ အလတ်စားခရီးများ ၃၀၀ ကျပ်၊ နှင့် အဝေးပြေးလမ်းကြောင်းများ ၄၀၀-၅၀၀ ကျပ် ကျသင့်ပါသည်။',
    },
    {
      questionEn: 'What if my card doesn\'t work?',
      questionMm: 'ကျွန်ုပ်၏ကတ် အလုပ်မလုပ်ပါက ဘာလုပ်ရမလဲ?',
      answerEn: 'First, check if your card has sufficient balance. If the card is damaged or not reading, visit a YBS service center for replacement. Keep your card number for reference.',
      answerMm: 'ပထမဦးစွာ၊ သင့်ကတ်တွင် လုံလောက်သော လက်ကျန်ငွေ ရှိမရှိ စစ်ဆေးပါ။ ကတ်ပျက်စီးနေပါက သို့မဟုတ် မဖတ်နိုင်ပါက၊ အစားထိုးရန် YBS ဝန်ဆောင်မှုစင်တာသို့ သွားရောက်ပါ။ ကိုးကားရန်အတွက် သင့်ကတ်နံပါတ်ကို သိမ်းထားပါ။',
    },
    {
      questionEn: 'Can I get a refund for unused balance?',
      questionMm: 'အသုံးမပြုရသေးသော လက်ကျန်ငွေကို ပြန်ရနိုင်ပါသလား?',
      answerEn: 'Yes, you can request a refund at YBS service centers. You may need to return your card and provide identification. A small processing fee might apply.',
      answerMm: 'ဟုတ်ကဲ့၊ YBS ဝန်ဆောင်မှုစင်တာများတွင် ပြန်အမ်းငွေ တောင်းဆိုနိုင်ပါသည်။ သင့်ကတ်ကို ပြန်အပ်ရန်နှင့် မှတ်ပုံတင် ပြရန် လိုအပ်နိုင်ပါသည်။ စီမံဆောင်ရွက်ခ အနည်းငယ် ကျသင့်နိုင်ပါသည်။',
    },
    {
      questionEn: 'Where can I find customer service?',
      questionMm: 'ဖောက်သည်ဝန်ဆောင်မှုကို ဘယ်မှာရှာနိုင်မလဲ?',
      answerEn: 'YBS customer service centers are located at major terminals including Aung Mingalar, Hlaing Thar Yar, and Highway terminals. Call their hotline or check the official YBS website for more locations.',
      answerMm: 'YBS ဖောက်သည်ဝန်ဆောင်မှုစင်တာများသည် အောင်မင်္ဂလာ၊ လှိုင်သာယာ၊ နှင့် အဝေးပြေးဂိတ်များအပါအဝင် အဓိကဂိတ်ကြီးများတွင် တည်ရှိပါသည်။ ၎င်းတို့၏ ဖုန်းနံပါတ်သို့ ခေါ်ဆိုပါ သို့မဟုတ် နောက်ထပ်နေရာများအတွက် တရားဝင် YBS ဝက်ဘ်ဆိုက်ကို ကြည့်ပါ။',
    },
  ];

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[90vh] glass sm:rounded-[40px] border-t sm:border border-white/20 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="font-black text-white uppercase tracking-tight italic text-xl">
              {language === 'en' ? 'YBS Card Guide' : 'YBS ကတ် လမ်းညွှန်'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'en' ? 'Everything you need to know' : 'သင်သိရန် လိုအပ်သမျှ'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'mm' : 'en')}
              className="px-4 py-2 rounded-xl bg-white/5 text-sm font-bold text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
            >
              {language === 'en' ? 'မြန်မာ' : 'EN'}
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:bg-white/10 transition-colors border border-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* Guide Steps */}
            <div>
              <h4 className="text-lg font-bold text-yellow-400 mb-4">
                {language === 'en' ? 'Getting Started' : 'စတင်ခြင်း'}
              </h4>
              <div className="space-y-6">
                {guideSections.map((section, idx) => (
                  <div key={idx} className="glass-card p-5 border border-white/10 rounded-2xl">
                    <h5 className="font-bold text-white mb-2 text-base">
                      {language === 'en' ? section.titleEn : section.titleMm}
                    </h5>
                    <p className="text-sm text-slate-300 leading-relaxed myanmar-font">
                      {language === 'en' ? section.contentEn : section.contentMm}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h4 className="text-lg font-bold text-yellow-400 mb-4">
                {language === 'en' ? 'Frequently Asked Questions' : 'မကြာခဏမေးလေ့ရှိသောမေးခွန်းများ'}
              </h4>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="glass-card border border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                      className="w-full p-4 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="font-bold text-white text-sm myanmar-font pr-4">
                        {language === 'en' ? faq.questionEn : faq.questionMm}
                      </span>
                      <svg
                        className={`w-5 h-5 text-yellow-400 transition-transform flex-shrink-0 ${
                          expandedFAQ === idx ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedFAQ === idx && (
                      <div className="px-4 pb-4 pt-1 border-t border-white/5">
                        <p className="text-sm text-slate-300 leading-relaxed myanmar-font">
                          {language === 'en' ? faq.answerEn : faq.answerMm}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Tips */}
            <div className="glass-card p-5 border border-yellow-400/30 rounded-2xl bg-yellow-400/5">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h5 className="font-bold text-yellow-400 mb-2">
                    {language === 'en' ? 'Pro Tip' : 'အကြံပြုချက်'}
                  </h5>
                  <p className="text-sm text-slate-300 leading-relaxed myanmar-font">
                    {language === 'en'
                      ? 'Use this Card Companion app to track your spending patterns and get reminders when your balance is running low. Enable NFC to quickly check your balance without waiting at top-up stations.'
                      : 'သင်၏ အသုံးစရိတ်ပုံစံများကို ခြေရာခံရန်နှင့် လက်ကျန်ငွေ နည်းလာသောအခါ သတိပေးချက်များရရှိရန် ဤ Card Companion အက်ပ်ကို အသုံးပြုပါ။ ငွေဖြည့်စခန်းများတွင် မစောင့်ဆိုင်းဘဲ သင့်လက်ကျန်ငွေကို မြန်မြန်ဆန်ဆန် စစ်ဆေးရန် NFC ကို ဖွင့်ပါ။'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardGuide;
