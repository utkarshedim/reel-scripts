# Daily reel pipeline

Nobody is watching this run: never stop to ask, take your own best call at every choice.

## Stage 1: Find

0. Read `inbox.txt`. If it has anything in it (a topic in Utkarsh's words, a link, or both),
   that is today's story, chosen by him: skip the rest of Stage 1, ignore `topics.txt` for it,
   and research it. If it has several lines, take only the first story and leave the rest in
   the file for the next runs. Remove the story you took from `inbox.txt`, and in Stage 2 log
   it with the kind **Manual** (no shortlist or discovery file needed).
1. Run `node scripts/discover.mjs > log/YYYY-MM-DD.discovery.json` (today's date; if
   `log/YYYY-MM-DD.md` already exists this is a rerun, so use `YYYY-MM-DD-run2`, then `-run3`)
   and read it. It stays next to the log so a pick can be checked later. `status` says which sources worked.
   It holds Techmeme (what the most outlets cover), the Hacker News front page, Google Trends
   for India and the US, Google News India for the last 24 hours, Google News India's top
   Technology stories, today's top AI papers on Hugging Face, Product Hunt launches and
   GitHub's trending repos. Several of these are where builders talk; Google Trends and
   Google News are where the public is. Weigh both.
2. Search the web too: AI and tech news in India today, the tech stories people are talking
   about on X, Instagram and YouTube right now, and new AI launches today. If most discovery
   sources failed, the web search carries the run.
   A story counts if it broke in the last 24 hours, or if it is still big and still developing
   over the last 3 days.
3. Read `topics.txt` and drop any story already listed. A real new development in an old story
   is a new story.
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
   a primary source (the company's own post, the paper, the repo, the filing) or two
   independent reliable outlets.
5. Pick today's story from the shortlist: the one that makes the strongest reel,
   whatever its kind. Weigh how many people care, how strong the hook is, what the viewer gets
   from it, and whether there are real things to show (a demo, a product, a person, a screen).

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

1. Commit on main and push to origin main. Never create a claude/ branch.
2. Run `node scripts/send-telegram.mjs log/YYYY-MM-DD.final.txt` (or the `-run2` file).
