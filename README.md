
# YBS Guide — YBS AI

## မြန်မာဘာသာ (Myanmar-first) — Feature & Ideas

ဒီမှာ `YBS Guide — YBS AI` ကို မြန်မာအသုံးပြုသူတွေအတွက် ပိုပြီး အသုံးဝင်အောင် တိုးတက်ရေး အကြံပြုချက်များကို မြန်မာလို ဖော်ပြထားပါတယ်။

### ၁။ Route Finder (လမ်းကြောင်းရှာဖွေမှု)

- လက်ရှိ: မူလနေရာ → ဦးတည်ရာ → ဘတ်စ်လိုင်း အကြံပြု။
- တိုးတက်အောင်: အမြန်ဆုံး၊ ဘတ်စ်ပြောင်းနည်းဆုံး၊ လမ်းလျှောက်နည်းဆုံး စတဲ့ အမျိုးအစားရွေးချယ်စေ။
- ဘတ်စ်ပြောင်းရမယ့်တည်နေရာကို ရှင်းပြပေးရန် (ဥပမာ – “လှိုင်မြို့နယ်မှာ ဘတ်စ်ပြောင်းပါ”)။
- လမ်းလျှောက်အကွာအဝေး ဖော်ပြ (ဥပမာ – “မီတာ ၃၀၀ လမ်းလျှောက်ရန်”)။
- ယာဉ်ခ ခန့်မှန်းချက် ပြသနိုင်စေရန် fee estimation ထည့်ရန်။

### ၂။ မြန်မာဘာသာ ဦးစားပေး UI

- Route အမည်၊ Stop Name တွေကို မြန်မာစာ အထက် ပြသပြီး အောက်မှာ အင်္ဂလိပ် ပြသ။
- Language Toggle: မြန်မာ (default) / English
- AI Assistant ကို မြန်မာစကားပုံစံနဲ့ ပြန်ဖြေ/ဖော်ပြပေးရန် localization လုပ်ရန်။

### ၃။ Offline Mode

- `routes`, `stops`, `shapes` ကို cache ထားရန် (service worker / local cache).
- Online/Offline status ကို ကိုးကားပြသ (🔴 Offline / 🟢 Online).
- AI ရရှိမယ်မရရှိမီ Rule-based fallback တစ်ခု ထည့်ရန်။

### ၄။ Map UX

- Stop icons အမျိုးအစားများ (ပုံမှန်၊ ဘတ်စ်ပြောင်း၊ အဆုံးမှတ်).
- Route အရောင်များကို category/line အလိုက် ခွဲပြရန်။
- Zoom အလိုက် stops clustering / aggregate ပြရန်။

### ၅။ Live Simulation

- Simulation speed ပြင်နိုင်စေပါ။
- Route အပေါ် များစွာသော ဘတ်စ်ကားများ ပြသနိုင်ရန်။
- ရက်/အချိန်အလိုက် simulation schedule (မနက်/ည). 

### ၆။ အနီးဆုံး ဘတ်စ် (Nearby Bus)

- User location ကို အသုံးပြုပြီး အနီးဆုံးမှတ်တိုင်များ မျက်နှာပြင်ပေါ် ဖော်ပြရန်။
- “ဒီနေရာကနေ ဘယ်ဘတ်စ်စီးရမလဲ?” ခလုတ်။

### ၇။ AI Assistant အသုံးဝင်မှုကောင်းစေခြင်း

- AI သည် သုံးစွဲသူ ရွေးထားသော Route, နောက်ဆုံးရှာထားသော Trip, သင့်တည်နေရာကို သိရှိထားရန်။
- AI response များကို မြန်မာ localization ဖြင့် ပြန်ထုတ်ပေးရန်။

### ၈။ Saved Trips

- ခရီးစဉ်များကို အမည်ပေး၍ သိမ်းဆည်းနိုင်စေပါ (ဥပမာ – “အိမ် → အလုပ်”)။
- အချိန်သတ်မှတ်၍ သတိပေးစနစ် ထည့်နိုင်ပါစေ။

### ၉။ Mobile UI / Accessibility

- Bottom sheet UI, large-text mode, high-contrast mode စသည်တို့ထည့်သွင်းရန်။

---

## Key Features (English)

> A lightweight React + Vite app for exploring Yangon Bus Service routes, maps and an AI assistant.

## Key Features

- Route Finder: search origin → destination and see suggested bus lines.
- Bus List: browse all routes, view route overview and open full path details.
- Interactive Map: `BusMap` uses Leaflet (`react-leaflet`) to render route shapes and stops.
- Route Detail Modal: ordered stops, map preview, and live simulation toggle.
- Live Simulation: simulated vehicle positions along route shapes (for demo/live mode).
- Saved Trips: store up to 5 recent trips in `localStorage`.
- AI Assistant: integrates with `services/geminiService.ts` for route suggestions and chat.
- Offline-friendly static data: routes, stops and shapes are loaded from the `data/` folder.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS (utility classes used extensively)
- Leaflet + react-leaflet for maps
- Project scripts managed via `package.json`

## Project Structure (important files)

- `App.tsx` — main app and navigation, route finder, bus list, AI assistant.
- `components/BusMap.tsx` — Leaflet map, tile layer, polyline, markers, live vehicle simulation.
- `components/MapPage.tsx` — stub (map functionality primarily in `BusMap`).
- `data/` — route JSONs, `routes-index.json`, and `stops.tsv` (static datasets used by the app).
- `services/geminiService.ts` — AI integration and helper functions.
- `index.tsx` — app entry; imports `leaflet/dist/leaflet.css`.

## Running locally

Install dependencies and run dev server:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Deployment notes (Vercel)

- During development the app fetches static files with absolute paths like `/data/...` (e.g. `/data/stops.tsv`, `/data/routes-index.json`).
- For production on Vercel (or any static host) make sure the `data/` files are served from the `public/` directory.

Recommended quick fix for Vercel:

```bash
mkdir -p public/data
cp -r data/* public/data/
git add public/data
git commit -m "Add static data to public for production (fix map on Vercel)"
git push
```

- Alternatively, bundle the assets with Vite using `import.meta.glob` or add a copy step/plugin (e.g. `vite-plugin-static-copy`).
- If you host under a non-root base path, ensure fetch URLs use `import.meta.env.BASE_URL` or relative paths.

## Troubleshooting

- Map doesn't show on deployed site: verify `public/data` contains the same files as `data/`, and check browser console for 404s on `/data/*` fetches.
- Leaflet icons not showing: `leaflet/dist/leaflet.css` is imported in `index.tsx`; ensure it remains.

## Next steps / optional improvements

- Move `data/` into `public/` or implement Vite bundling for route assets.
- Add server API for dynamic vehicle positions if real-time data becomes available.
- Add unit/integration tests for services and components.

## License

This repository does not include an explicit license file. Add `LICENSE` if you wish to publish with a specific license.

----

README updated with Myanmar-first feature suggestions.