# Daily top 10

Nobody is watching this run: never stop to ask.

What this is for: an AI and tech reel channel. This is not a news desk and not an RSS feed.
The goal is to deliver value while catching what's going viral. Think of an urban, educated
person aged 18 to 30: often in tech through college, the office or his profession; if not,
someone whose job and career one of these updates will affect; and in any case an aware human
being who wants to know where the world is shifting and how the future is going to look. Keep
a balance across updates and news, AI models and releases, robotics, products, tools and
features, and research worth knowing (things like MIT or IEEE work, AI in biotech, space).
Leave policy and government out.

1. Run `git fetch origin main && git checkout main && git reset --hard origin/main`.
2. Research and find the 10 best AI and tech updates from the last 24 hours for the purpose
   above, keeping the balance. Use your common sense. (If the web search tool has a fresh or extended mode,
   use it, because the standard mode often returns results that are days old.)
3. Don't repeat any story already sent in a `log/*.top10.txt` from the last 24 hours.
4. Save the list as plain text to `log/YYYY-MM-DD.top10.txt` (if that file exists, use
   `-run2`, then `-run3`): 10 numbered items, each with a short line on what happened and a
   source link.
5. Commit on main and push to origin main (if the push is rejected, `git pull --rebase origin
   main` and push again).
6. Run `node scripts/send-telegram.mjs log/YYYY-MM-DD.top10.txt` (or the `-run2` file).
