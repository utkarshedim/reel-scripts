# Reel scripts

Every day a scheduled task follows `PIPELINE.md`: it finds what's buzzing, rising or important
in AI and tech, picks one story for a reel, logs it in `log/` (with every covered topic in
`topics.txt`, so stories don't repeat), writes the script with `SCRIPT_PROMPT.md` and sends the
final script to Telegram.

`node scripts/recent.mjs` lists what's already been made in the last 48 hours across every branch
(runs can land on different branches), so a story isn't made twice.

`node scripts/discover.mjs` gathers the raw signals from free sources (no keys): Techmeme,
Hacker News, Google Trends India, Google News India, Hugging Face papers, Product Hunt and
GitHub trending.

To make a video on your own topic, write it (words, a link, or both) in `inbox.txt` and press
"Run now" on the task, or leave it for the next daily run. One story per line; each run takes
the first one.
