# Daily top 10

Nobody is watching this run: never stop to ask.

1. Run `git fetch origin main && git checkout main && git reset --hard origin/main`.
2. Research and find the 10 best AI and tech updates from the last 24 hours. There are no
   rules: just use your common sense. (If the web search tool has a fresh or extended mode,
   use it, because the standard mode often returns results that are days old.)
3. Don't repeat any story already sent in a `log/*.top10.txt` from the last 24 hours.
4. Save the list as plain text to `log/YYYY-MM-DD.top10.txt` (if that file exists, use
   `-run2`, then `-run3`): 10 numbered items, each with a short line on what happened and a
   source link.
5. Commit on main and push to origin main (if the push is rejected, `git pull --rebase origin
   main` and push again).
6. Run `node scripts/send-telegram.mjs log/YYYY-MM-DD.top10.txt` (or the `-run2` file).
