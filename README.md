# 🤖 Facebook + Telegram Chatbot (Claude AI)

Bot ឆ្លើយ message ដោយស្វ័យប្រវត្តិ ២ Platform — ឥតគិតថ្លៃ!

---

## 📁 Files

```
chatbot/
├── server.js        ← Code សំខាន់
├── package.json     ← Dependencies
├── .env.example     ← Template សម្រាប់ Keys
└── README.md        ← ឯកសារនេះ
```

---

## 🚀 ជំហានដំឡើង

### ជំហាន 1 — រៀបចំ Facebook

1. ចូល https://developers.facebook.com
2. My Apps → Create App → Business
3. Add Product → Messenger → Setup
4. ភ្ជាប់ Facebook Page → Generate Page Access Token
5. Copy Token → ដាក់ក្នុង `FB_PAGE_TOKEN`

### ជំហាន 2 — រៀបចំ Telegram

1. ចូល Telegram → ស្វែងរក **@BotFather**
2. វាយ `/newbot`
3. ដាក់ឈ្មោះ Bot → BotFather ផ្ញើ Token
4. Copy Token → ដាក់ក្នុង `TELEGRAM_BOT_TOKEN`

### ជំហាន 3 — Claude API Key

1. ចូល https://console.anthropic.com
2. API Keys → Create Key
3. Copy → ដាក់ក្នុង `CLAUDE_API_KEY`

### ជំហាន 4 — Deploy លើ Render.com

1. Upload folder នេះទៅ GitHub (repo ថ្មី)
2. ចូល https://render.com → New Web Service
3. ភ្ជាប់ GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Environment Variables → Add ទាំងអស់ពី `.env.example`
6. Deploy → ចម្លង URL ដូចជា `https://my-chatbot.onrender.com`

### ជំហាន 5 — ភ្ជាប់ Facebook Webhook

1. Facebook Developer → App → Messenger → Webhooks → Edit
2. Callback URL: `https://my-chatbot.onrender.com/webhook/facebook`
3. Verify Token: (ដូចគ្នា `FB_VERIFY_TOKEN`)
4. Subscribe: ✅ messages

### ជំហាន 6 — ភ្ជាប់ Telegram Webhook

បើ Browser ឬ Postman ហៅ URL នេះ:

```
https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url=https://my-chatbot.onrender.com/webhook/telegram
```

ប្តូរ `{TELEGRAM_BOT_TOKEN}` ជា Token ពិតប្រាកដ

---

## ✅ ពិនិត្យ

- Facebook: ផ្ញើ message ទៅ Page → Bot ត្រូវតែឆ្លើយ
- Telegram: ផ្ញើ message ទៅ Bot → Bot ត្រូវតែឆ្លើយ

---

## 💰 តម្លៃ

| Service | ថ្លៃ |
|---------|------|
| Render.com (free tier) | $0/ខែ |
| Meta Messenger API | $0 |
| Telegram Bot API | $0 |
| Claude API | ~$0.01 / 1000 messages |

**សរុប: ស្ទើរតែឥតគិតថ្លៃ!**

---

## ✏️ Custom System Prompt

កែប្រែ `SYSTEM_PROMPT` នៅក្នុង `server.js` ដើម្បីឲ្យ Bot ដំណើរការតាម Business របស់អ្នក:

```js
const SYSTEM_PROMPT = `អ្នកជា assistant សម្រាប់ហាង [ឈ្មោះហាង]។
- ឆ្លើយសំណួរអំពី ផ្លែឈើ តម្លៃ ម៉ោងបើក/បិទ
- ប្រសិនបើចង់ order ណែនាំ call: 012 xxx xxx`;
```
