# Nomadic

Offline-first luggage, wardrobe, and packing planner for digital nomads.

Nomadic is a web app for people who move often: digital nomads, long-stay travelers, frequent flyers, and minimalists who want to keep their luggage lighter and more intentional. It helps users manage luggage limits, organize personal items, build outfit combinations, and generate packing suggestions with optional AI support.

Live demo: https://nomadicmyluggage.vercel.app  
Repository: https://github.com/Kelsidreamland/nomadic

## 中文简介

Nomadic 是一个给数字游牧、旅居者和极简旅行者使用的行李与物品管理工具。它的核心目标不是做一个普通清单，而是帮助用户在出发前回答几个实际问题：

- 我的行李箱尺寸、重量和航空公司限制有没有冲突？
- 哪些衣服真的百搭，哪些只是占空间？
- 哪些物品快过期、快用完，出发前需要补充？
- 如果使用 AI，能不能根据行程、天气、衣物库和行李限额给出更精简的打包建议？

这个仓库公开的是 Nomadic 的 local-first 开源核心。未来如果有托管同步、团队协作或付费 AI 额度等商业服务，可以另外发展；但目前这个仓库里的代码会维持可本地运行、可学习、可修改的开源版本。

## Features

- Luggage management: track checked luggage, carry-on bags, personal items, dimensions, and weight limits.
- Smart inventory: manage clothes, gear, skincare, consumables, seasons, condition, expiration dates, and notes.
- Outfit planning: connect tops and bottoms, estimate versatility, and use outfit data to reduce unnecessary packing.
- Trip preparation: summarize luggage weight, upcoming trip context, and packing checklist progress.
- Optional AI assistance: use Gemini to classify item photos, parse itinerary text/images, and generate packing suggestions.
- Offline-first storage: user data is stored in the browser through IndexedDB by default.
- Multilingual UI: Traditional Chinese first, with English support through i18n.

## Project Status

Nomadic is an active personal open-source project. The current codebase already supports the local-first luggage and wardrobe workflow. OCR/PDF import, guided product tours, and drag-and-drop outfit pairing are under active development.

## Open Source Boundary

The open-source core includes:

- React/Vite frontend app
- IndexedDB data model
- luggage, inventory, outfit, and packing UI
- optional AI integration layer
- Vercel serverless API proxy for Gemini

Not included in the public repository:

- production API keys
- private user data
- hosted service credentials
- deployment account access

The repository uses the MIT License. You may use, modify, and build on the code, including for commercial use, as long as the license terms are followed.

## Privacy And AI

Nomadic is designed as a local-first app. Core luggage and inventory data is stored in the user's browser. AI features are optional:

- In production, `/api/analyze` expects a server-side `GEMINI_API_KEY`.
- In local development, `VITE_GEMINI_API_KEY` can be used for testing, but this exposes the key to the browser and should not be used for production.
- Users can also configure their own Gemini key inside the app for local testing.

No real API key should be committed to this repository.

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- Dexie.js / IndexedDB
- react-i18next
- Google Generative AI SDK
- Vercel serverless functions

## Local Development

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Start the local dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Environment Variables

```bash
# Server-side only. Used by api/analyze.js in production deployments.
GEMINI_API_KEY=

# Optional local development key. Vite exposes this to browser code.
VITE_GEMINI_API_KEY=
```

## Deployment

The app can be deployed as a static Vite app with a Vercel serverless function for AI requests.

Recommended production setup:

- Build command: `npm run build`
- Output directory: `dist`
- Serverless function: `api/analyze.js`
- Required production env var for AI features: `GEMINI_API_KEY`

The local-first core still works without AI configuration; AI-only actions will require a configured key.

## License

MIT License. See [LICENSE](./LICENSE).
