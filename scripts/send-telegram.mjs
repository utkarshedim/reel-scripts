/**
 * Sends a text file to Telegram as plain-text messages (split under Telegram's 4096-character
 * limit, at blank lines where possible). Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID; several
 * chat IDs can be given, comma-separated.
 *
 *   node scripts/send-telegram.mjs log/2026-11-11.final.txt
 */
import fs from 'node:fs/promises';

const file = process.argv[2];
const token = process.env.TELEGRAM_BOT_TOKEN;
const chats = (process.env.TELEGRAM_CHAT_ID || '').split(',').map((c) => c.trim()).filter(Boolean);
if (!file) {
  console.error('usage: node scripts/send-telegram.mjs <file>');
  process.exit(1);
}
if (!token || chats.length === 0) {
  console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set in this environment; nothing sent.');
  process.exit(1);
}

const text = (await fs.readFile(file, 'utf8')).trim();
const parts = [];
let rest = text;
while (rest.length > 3800) {
  let cut = rest.lastIndexOf('\n\n', 3800);
  if (cut < 1000) cut = rest.lastIndexOf('\n', 3800);
  if (cut < 1000) cut = 3800;
  parts.push(rest.slice(0, cut).trim());
  rest = rest.slice(cut).trim();
}
parts.push(rest);

for (const chat of chats) {
  for (const part of parts) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: part, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      console.error(`Telegram refused the message for chat ${chat}: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
  }
}
console.log(`Sent ${file} to Telegram (${parts.length} message${parts.length > 1 ? 's' : ''}).`);
