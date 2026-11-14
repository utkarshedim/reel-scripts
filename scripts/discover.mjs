/**
 * Reel discovery: collects today's raw signals from free sources that need no key.
 *
 *   node scripts/discover.mjs > /tmp/discovery.json
 *
 * Sources, each fetched on its own so one failing never stops the rest:
 *   ainews        AINews (Latent Space): its daily recap of what hundreds of AI accounts on X
 *                 posted, top posts by engagement first, plus AI Reddit and Discord (weekdays)
 *   telegram      the latest posts from public AI news channels on Telegram, with views, plus
 *                 Watcher Guru's breaking news filtered to AI and tech
 *   techmeme      the tech stories the most outlets are covering, in Techmeme's order
 *   hackerNews    the Hacker News front page, with points, comments and age
 *   googleNews    the last 24 hours of AI news as covered in India
 *   hfPapers      today's most upvoted AI papers on Hugging Face (early, often under the radar)
 *   githubTrending  repos gaining stars fastest today
 *
 * Writes one JSON object: { fetchedAt, status: { source: "ok (n)" | "failed: why" }, ...sources }.
 */

const TELEGRAM_CHANNELS = ['aipost', 'hiaimediaen', 'CoreAti', 'watcherguru'];
// General breaking-news channels: keep only their posts about AI and tech.
const AI_ONLY_CHANNELS = ['watcherguru'];
const AI_WORDS = /\b(AI|A\.I\.|artificial intelligence|OpenAI|ChatGPT|GPT|Anthropic|Claude|Gemini|Google|DeepMind|Grok|xAI|Nvidia|Meta|Microsoft|Apple|Tesla|robot\w*|chip\w*|DeepSeek|Perplexity|Musk|Altman|Zuckerberg|tech)\b/i;

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36' };

const get = async (url, as = 'text') => {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return as === 'json' ? res.json() : res.text();
};

const decode = (s) =>
  (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : null;
};
const items = (xml, name = 'item') => [...xml.matchAll(new RegExp(`<${name}[\\s>][\\s\\S]*?</${name}>`, 'g'))].map((m) => m[0]);

const sources = {
  async ainews() {
    const xml = await get('https://latent.space/feeds/news.xml');
    const list = items(xml).length ? items(xml) : items(xml, 'entry');
    return list.slice(0, 2).map((b) => {
      const text = (tag(b, 'content:encoded') || tag(b, 'content') || tag(b, 'description') || '')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const start = text.search(/AI Twitter Recap/i);
      return {
        title: tag(b, 'title'),
        link: tag(b, 'link') || (b.match(/<link[^>]*href="([^"]+)"/) || [])[1],
        published: tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated'),
        twitterRecap: text.slice(Math.max(start, 0), Math.max(start, 0) + 9000),
      };
    });
  },

  async telegram(notes) {
    const out = [];
    const since = Date.now() - 36 * 3600 * 1000;
    const parse = (html, ch) => html.split('tgme_widget_message_wrap').slice(1).map((b) => ({
      channel: ch,
      id: Number(((b.match(/data-post="[^"/]+\/(\d+)"/) || [])[1]) || 0),
      text: decode((b.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').slice(0, 400),
      views: (b.match(/tgme_widget_message_views">([^<]+)</) || [])[1] || '',
      date: (b.match(/<time[^>]*datetime="([^"]+)"/) || [])[1] || '',
      link: `https://t.me/${(b.match(/data-post="([^"]+)"/) || [])[1] || ch}`,
    }));
    for (const ch of TELEGRAM_CHANNELS) {
      try {
        // A channel page shows only its latest ~20 posts, so page back (up to 3 pages) to cover 36 hours.
        let posts = [];
        let url = `https://t.me/s/${ch}`;
        for (let page = 0; page < 3; page++) {
          const batch = parse(await get(url), ch);
          posts = batch.concat(posts);
          const oldest = batch.filter((p) => p.id).sort((a, b) => a.id - b.id)[0];
          if (!oldest || !oldest.date || Date.parse(oldest.date) < since) break;
          url = `https://t.me/s/${ch}?before=${oldest.id}`;
        }
        let fresh = posts.filter((p) => p.text && (!p.date || Date.parse(p.date) >= since));
        if (AI_ONLY_CHANNELS.includes(ch)) fresh = fresh.filter((p) => AI_WORDS.test(p.text));
        if (!fresh.length) notes.push(`${ch}: no matching posts in the last 36 hours`);
        out.push(...fresh.slice(-20).map(({ id, ...p }) => p));
      } catch (e) {
        notes.push(`${ch} failed: ${e.message}`);
      }
    }
    return out;
  },

  async techmeme() {
    return items(await get('https://www.techmeme.com/feed.xml')).slice(0, 20).map((b, i) => ({
      rank: i + 1,
      title: tag(b, 'title'),
      link: tag(b, 'link'),
      published: tag(b, 'pubDate'),
      summary: (tag(b, 'description') || '').slice(0, 400),
    }));
  },

  async hackerNews() {
    const data = await get('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30', 'json');
    const now = Date.now() / 1000;
    return data.hits.map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      discussion: `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points,
      comments: h.num_comments,
      hoursAgo: Math.round((now - h.created_at_i) / 3600),
    }));
  },

  async googleNews() {
    const q = encodeURIComponent('(AI OR "artificial intelligence" OR OpenAI OR ChatGPT OR Gemini OR Anthropic OR Claude OR Nvidia OR DeepSeek OR Grok) when:1d');
    return items(await get(`https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`)).slice(0, 30).map((b) => ({
      title: tag(b, 'title'),
      link: tag(b, 'link'),
      outlet: tag(b, 'source'),
      published: tag(b, 'pubDate'),
    }));
  },

  async hfPapers() {
    const data = await get('https://huggingface.co/api/daily_papers', 'json');
    return data
      .map((d) => ({
        title: d.paper?.title ?? d.title,
        upvotes: d.paper?.upvotes ?? 0,
        url: `https://huggingface.co/papers/${d.paper?.id ?? ''}`,
        summary: (d.paper?.summary ?? '').replace(/\s+/g, ' ').slice(0, 300),
      }))
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 10);
  },

  async githubTrending() {
    const html = await get('https://github.com/trending?since=daily');
    return [...html.matchAll(/<article class="Box-row">([\s\S]*?)<\/article>/g)].slice(0, 15).map(([, a]) => {
      const repo = ((a.match(/<h2[\s\S]*?href="\/([^"]+)"/) || [])[1] || '').trim();
      return {
        repo,
        url: `https://github.com/${repo}`,
        description: decode((a.match(/<p class="[^"]*">([\s\S]*?)<\/p>/) || [])[1] || ''),
        starsToday: decode((a.match(/([\d,]+) stars today/) || [])[1] || ''),
      };
    });
  },
};

const out = { fetchedAt: new Date().toISOString(), status: {} };
await Promise.all(
  Object.entries(sources).map(async ([name, fn]) => {
    const notes = [];
    try {
      const list = await fn(notes);
      out[name] = list;
      out.status[name] = (list.length ? `ok (${list.length})` : 'failed: empty') + (notes.length ? `; ${notes.join('; ')}` : '');
    } catch (e) {
      out[name] = [];
      out.status[name] = `failed: ${e.message}`;
    }
  }),
);
console.log(JSON.stringify(out, null, 1));
console.error(Object.entries(out.status).map(([k, v]) => `  ${k.padEnd(15)} ${v}`).join('\n'));
