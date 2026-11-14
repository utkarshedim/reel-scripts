# Daily reel pipeline

Nobody is watching this run: never stop to ask, take your own best call at every choice.

## Stage 0: Start from the latest main

Run `git fetch origin main && git checkout main && git reset --hard origin/main` before
anything else. Every run must read the `topics.txt` the earlier runs pushed, or it will pick
a story that was already done today. Do all the work on main.

## Stage 1: Find

0. Read `inbox.txt`. If it has anything in it (a topic in Utkarsh's words, a link, or both),
   that is today's story, chosen by him: skip the rest of Stage 1, ignore `topics.txt` for it,
   and research it. If it has several lines, take only the first story and leave the rest in
   the file for the next runs. Remove the story you took from `inbox.txt`, and in Stage 2 log
   it with the kind **Manual** (no shortlist or discovery file needed).
1. Run `node scripts/discover.mjs > log/YYYY-MM-DD.discovery.json` (today's date; if
   `log/YYYY-MM-DD.md` already exists this is a rerun, so use `YYYY-MM-DD-run2`, then `-run3`)
   and read it. It stays next to the log so a pick can be checked later. `status` says which sources worked.
   The first three are where the AI world's conversation on X shows up, so weigh them most:
   AINews (its daily recap of what hundreds of AI accounts on X posted, top posts by
   engagement first; weekdays only, so on weekends read its latest issue for what is still
   developing), today's top posts in the main AI subreddits (score and comments show how big
   a story is), and the latest posts from public AI news channels on Telegram (with views).
   After those come Techmeme (what the most outlets cover), the Hacker News front page,
   Google News India's AI stories from the last 24 hours, today's top AI papers on Hugging
   Face and GitHub's trending repos.
2. Search the web too: what AI people on X are posting about today, new AI launches today,
   and AI news in India today. If most discovery
   sources failed, the web search carries the run.
   A story counts if it broke in the last 24 hours, or if it is still big and still developing
   over the last 3 days.
3. Read `topics.txt` and drop any story already listed, above all anything from the last 48
   hours. A new angle on the same story is the same story; only a real new development (a new
   event, not a new detail) makes it new.
4. Build a shortlist of 5 to 8 stories. Each is one of three kinds. The three are **equally
   valid**: never rank one kind above another, and don't fill a quota of each.
   - **Buzzing:** a lot of people are already talking about it. People, drama and controversy
     count when the tech at the centre of it is real.
   - **Rising:** not big yet, but the signals say it could go viral today (climbing fast on
     Hacker News, a repo gaining thousands of stars, a launch spreading quickly, a fresh spike
     in Google Trends).
   - **Under the radar:** few people are talking about it, but this audience should know it,
     because it changes something for them: their money, work, phone, privacy, or the tools
     they use.
   Every story on the list has an AI or tech core, can be told in one short video, and is backed by
   a primary source (the company's own post, including its official post on X, the founder's
   own post, the paper, the repo, the filing) or two independent reliable outlets. Reddit,
   Telegram and AINews are leads to the story, not sources for it.
5. Pick today's story from the shortlist. What counts most is how much the AI world is
   talking about it today (top posts in AINews, Reddit scores, Telegram views, Hacker News).
   Then weigh how strong the hook is, what the viewer gets from it, and whether there are real
   things to show. A big model or product launch is never too hard to show: the company's
   demo, its video or the before-and-after is the visual.

## Stage 2: Log

1. Write `log/YYYY-MM-DD.md` (on a rerun, the same `-run2` name as the discovery file):
   - **Today's pick:** the story in one line, its kind, why it's today's reel, the key facts
     each with its source link, and anything unconfirmed or disputed.
   - **Why not the others:** for each of the strongest two or three other stories, one line on
     why the pick beat it.
   - **Shortlist:** every other story, each with its kind, one line on why it's worth a reel,
     and its links.
   - **Sources:** the `status` line for each discovery source.
2. Add one line to `topics.txt`: `YYYY-MM-DD | kind | the story in a few words`.

## Stage 3: Script

1. Read `SCRIPT_PROMPT.md`: it is Utkarsh's own prompt. Treat today's pick as the story he
   sent, and do all five of its steps, including fresh research of the primary source. The log
   is a lead, not a source.
2. Save the whole answer to `log/YYYY-MM-DD.script.md` (on a rerun, the same `-run2` name).
3. Save the final script alone, as plain text, to `log/YYYY-MM-DD.final.txt`: the best hook,
   then the full script. No headings, notes or markdown.

## Stage 4: Save and send

1. Commit on main and push to origin main. Never create a claude/ branch. If the push is
   rejected because main moved, run `git pull --rebase origin main` and push again.
2. Run `node scripts/send-telegram.mjs log/YYYY-MM-DD.final.txt` (or the `-run2` file).
