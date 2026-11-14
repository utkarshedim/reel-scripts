# Daily top 10

Nobody is watching this run: never stop to ask, take your own best call at every choice.

1. Run `git fetch origin main && git checkout main && git reset --hard origin/main`. Do all
   the work on main.
2. Find the biggest AI and tech stories of the last 24 hours with web search. If the search
   tool has a fresh or extended mode, use it for every search: the standard mode often returns
   results that are days old. Search like an editor checking the day: what happened in AI
   today, tech news today, today's AI news roundups (search with today's date), then search
   each lead on its own to confirm what happened and when. Run as many searches as it takes.
3. Read every `log/*.top10.txt` sent in the last 24 hours (today's and yesterday's files,
   reruns included). Those stories are already delivered: don't list them again unless they
   took a major new turn since, and then say what's new. A rerun gives 10 stories not yet sent.
4. Pick 10 with common sense: the stories a serious AI and tech audience would most want to
   know about today, biggest first. A story counts only if it happened or took a major new turn
   in the last 24 hours.
5. Write `log/YYYY-MM-DD.top10.txt` (if it already exists this is a rerun: use `-run2`, then
   `-run3`). Plain text, no markdown. First line: `Top 10 AI and tech, <date>`. Then for each
   story, numbered 1 to 10: a one-line headline, one or two plain sentences with the key facts
   (numbers and names exact, and say plainly when something is claimed or not yet confirmed),
   and one link to the best source.
6. Commit on main and push to origin main. Never create a claude/ branch. If the push is
   rejected because main moved, run `git pull --rebase origin main` and push again.
7. Run `node scripts/send-telegram.mjs log/YYYY-MM-DD.top10.txt` (or the `-run2` file).
