const express = require('express');
const app = express();
app.use(express.json());

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Environment Variables
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FB_PAGE_TOKEN   = process.env.FB_PAGE_TOKEN;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const TG_BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// System Prompt — កែប្រែតាមចង់
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SYSTEM_PROMPT = `អ្នកជា assistant ដែលមានប្រយោជន៍សម្រាប់ Page/Bot នេះ។
- ឆ្លើយជាភាសាខ្មែរ ឬភាសាដែល user សរសេរ
- ឆ្លើយឱ្យខ្លី ច្បាស់លាស់ និងមានប្រយោជន៍
- ប្រសិនបើមិនដឹង សូមប្រាប់ត្រង់ៗ`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gemini AI — ស្នើសុំចម្លើយ (ឥតគិតថ្លៃ)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function askGemini(userMessage) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 1000 }
      })
    });
    const data = await response.json();
   if (data.candidates && data.candidates[0] && data.candidates[0].content) {
  return data.candidates[0].content.parts[0].text;
} else {
  console.error('Gemini Response:', JSON.stringify(data));
  return 'សូមអភ័យទោស មានបញ្ហា។ សូមព្យាយាមម្តងទៀត។';
}
  } catch (err) {
    console.error('Gemini Error:', err);
    return 'សូមអភ័យទោស មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។';
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FACEBOOK — Webhook Verification
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/webhook/facebook', (req, res) => {
  const mode  = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
    console.log('✅ Facebook Webhook verified!');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Facebook Webhook verification failed');
    res.sendStatus(403);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FACEBOOK — ទទួល & ឆ្លើយ Messages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post('/webhook/facebook', async (req, res) => {
  res.sendStatus(200); // ឆ្លើយ Facebook ជាមុន (required < 20s)

  const body = req.body;
  if (body.object !== 'page') return;

  for (const entry of body.entry) {
    const event = entry.messaging?.[0];
    if (!event?.message?.text) continue;

    const senderId   = event.sender.id;
    const userText   = event.message.text;

    console.log(`📘 Facebook | User: ${senderId} | Msg: ${userText}`);

    const reply = await askGemini(userText);
    await sendFacebookMessage(senderId, reply);
  }
});

async function sendFacebookMessage(recipientId, text) {
  try {
    await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text }
      })
    });
  } catch (err) {
    console.error('Facebook Send Error:', err);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TELEGRAM — ទទួល & ឆ្លើយ Messages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post('/webhook/telegram', async (req, res) => {
  res.sendStatus(200);

  const message = req.body?.message;
  if (!message?.text) return;

  const chatId   = message.chat.id;
  const userText = message.text;

  console.log(`✈️ Telegram | Chat: ${chatId} | Msg: ${userText}`);

  const reply = await askGemini(userText);
  await sendTelegramMessage(chatId, reply);
});

async function sendTelegramMessage(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (err) {
    console.error('Telegram Send Error:', err);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Health Check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/', (req, res) => {
  res.send('🤖 Bot is running! Facebook + Telegram + Gemini AI (Free)');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Start Server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Facebook Webhook: /webhook/facebook`);
  console.log(`✈️  Telegram Webhook: /webhook/telegram`);
});
