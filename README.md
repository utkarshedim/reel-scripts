# Daily top 10

Every morning a scheduled task follows `PIPELINE.md`: it searches the web for the last 24 hours
of AI and tech news, picks the 10 biggest stories, saves the list in `log/` and sends it to
Telegram with `scripts/send-telegram.mjs`.

`SCRIPT_PROMPT.md` is Utkarsh's script-writing prompt, kept for later; the daily run doesn't use it.
