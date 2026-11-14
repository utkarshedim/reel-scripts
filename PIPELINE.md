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
   AINews (its daily recap of what hundreds of AI accounts on X posted; weekdays only, so on
   weekends read its latest issue) and the AI news channels on Telegram show what the AI world
   is talking about. Techmeme (what the most outlets cover) and the Hacker News front page show
   what the tech press and builders lead with. Google News India's AI stories from the last 24
   hours, today's top AI papers on Hugging Face and GitHub's trending repos fill in the rest.
   All of these are leads. None of them decides how big a story is: you do (step 4).
2. Search the web too: what AI people on X are posting about today, new AI launches today,
   and AI news in India today. If most discovery
   sources failed, the web search carries the run.
   A story counts if it broke in the last 24 hours, or if it is still big and still developing
   over the last 3 days.
3. Read `topics.txt` and drop any story already listed, above all anything from the last 48
   hours. A new angle on the same story is the same story; only a real new development (a new
   event, not a new detail) makes it new.
4. Build a shortlist of 5 to 8 stories, biggest first. Judge size by how much the story
   matters, the way the editor of a serious tech news site would, not by views, likes or
   upvotes. The audience is 2 lakh people who follow this channel to know what is happening in
   AI and tech.
   - **Big stories, which belong on the list:** a real move by a major AI or tech company or
     lab (a model, product or robot launch from OpenAI, Google, Anthropic, Meta, Microsoft,
     Apple, Nvidia, xAI, Amazon, DeepSeek and their peers; a CEO change; a major deal or IPO);
     an outage or failure that hits millions of people or a country's systems; a law, ban,
     court ruling or government action with real consequences for AI or tech; a leak or
     announcement the whole industry is reacting to; the stories Techmeme and the big tech
     sites lead with.
   - **Never on the list, however viral:** curiosities and novelty (an AI song on a chart, AI
     art, AI pets, a quirky experiment, "AI did something funny or creepy"), tutorials and tool
     tips, small-startup funding rounds, opinion pieces and listicles.
   Label each story with its kind: **Buzzing** (a lot of people are already talking about it),
   **Rising** (not big yet, but spreading fast) or **Under the radar** (few are talking about
   it, but it changes something real for this audience: their money, work, phone, privacy or
   tools). The kind is a label, not a reason to pick.
   Every story on the list has an AI or tech core, can be told in one short video, and is backed by
   a primary source (the company's own post, including its official post on X, the founder's
   own post, the paper, the repo, the filing) or two independent reliable outlets. Telegram
   and AINews are leads to the story, not sources for it.
5. Pick the biggest story on the list: the one a serious tech creator with 2 lakh followers
   would be embarrassed to have skipped today. Ask: does it change something for millions of
   people or for the AI industry, and will people still be talking about it next week?
   - A developing or disputed story is not a reason to skip it. Say what is confirmed, who
     claims what, and what is still being investigated: that is the reel.
   - A related story earlier in the week is not a reason to skip it. Only the same event
     repeated is blocked (step 3); a new launch, decision or turn is a new story.
   - A big launch is never too hard to show: the company's demo, video or before-and-after is
     the visual.
   - Every big story you don't pick gets a line in "Why not the others" saying why.

## Stage 2: Log

1. Write `log/YYYY-MM-DD.md` (on a rerun, the same `-run2` name as the discovery file):
   - **Today's pick:** the story in one line, its kind, why it's today's reel, the key facts
     each with its source link, and anything unconfirmed or disputed.
   - **Why not the others:** for every other big story, one line on why the pick beat it.
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
