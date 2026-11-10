# Reel scripts

Every day a scheduled task follows `PIPELINE.md`: it finds what's buzzing, rising or important
in AI and tech, picks one story for a reel, logs it in `log/` (with every covered topic in
`topics.txt`, so stories don't repeat), writes the script with `SCRIPT_PROMPT.md` and sends the
final script to Telegram.

`node scripts/discover.mjs` gathers the raw signals from free sources (no keys): Techmeme,
Hacker News, Google Trends India, Google News India, Hugging Face papers, Product Hunt and
GitHub trending.
