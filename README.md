# Reel scripts

Every day a scheduled task follows `PIPELINE.md`: it finds what's buzzing, rising or important
in AI and tech, picks one story for a 60-second reel, and logs it in `log/` (with every
covered topic in `topics.txt`, so stories don't repeat).

`node scripts/discover.mjs` gathers the raw signals from free sources (no keys): Techmeme,
Hacker News, Google Trends India, Google News India, Hugging Face papers, Product Hunt and
GitHub trending.
