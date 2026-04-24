const express = require('express');
const app = express();
app.use(express.json());

const FB_PAGE_TOKEN   = process.env.FB_PAGE_TOKEN;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const TG_BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY    = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `អ្នកជា assistant ដែលមានប្រយោជន៍សម្រាប់ Page/Bot នេះ។
- ឆ្លើយជាភាសាខ្មែរ ឬភាសាដែល user សរសេរ
- ឆ្លើយឱ្យខ្លី ច្បាស់លាស់ និងមានប្រយោជន៍
- ប្រសិនបើមិនដឹង សូមប្រាប់ត្រង់ៗ`;

async function askGroq(userMessage) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000
      })
    });
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    console.error('Groq Response:', JSON.stringify(data));
    return 'សូមអភ័យទោស មានបញ្ហា។ សូមព្យាយាមម្តងទៀត។';
  } catch (err) {
    console.error('Groq Error:', err);
    return 'សូមអភ័យទោស មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។';
  }
}

app.get('/webhook/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook/facebook', async (req, res) => {
  res.sendStatus(200);
  const body = req.body;
  if (body.object !== 'page') return;
  for (const entry of body.entry) {
    const event = entry.messaging?.[0];
    if (!event?.message?.text) continue;
    const senderId = event.sender.id;
    const userText = event.message.text;
    console.log(`📘 Facebook | User: ${senderId} | Msg: ${userText}`);
    const reply = await askGroq(userText);
    await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: senderId }, message: { text: reply } })
    });
  }
});

app.post('/webhook/telegram', async (req, res) => {
  res.sendStatus(200);
  const message = req.body?.message;
  if (!message?.text) return;
  const chatId = message.chat.id;
  const userText = message.text;
  console.log(`✈️ Telegram | Chat: ${chatId} | Msg: ${userText}`);
  const reply = await askGroq(userText);
  await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: reply })
  });
});

app.get('/', (req, res) => {
  res.send('🤖 Bot is running! Facebook + Telegram + Groq AI (Free)');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Facebook Webhook: /webhook/facebook`);
  console.log(`✈️  Telegram Webhook: /webhook/telegram`);
});
