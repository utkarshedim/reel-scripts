/**
 * Reel discovery: collects today's raw signals from free sources that need no key.
 *
 *   node scripts/discover.mjs > /tmp/discovery.json
 *
 * Sources, each fetched on its own so one failing never stops the rest:
 *   ainews        AINews (Latent Space): its daily recap of what hundreds of AI accounts on X
 *                 posted, top posts by engagement first, plus AI Reddit and Discord (weekdays)
 *   reddit        today's top posts in the main AI subreddits, with score and comments; viral
 *                 X posts, demos and leaks get reposted here within hours
 *   telegram      the latest posts from public AI news channels on Telegram, with views
 *   techmeme      the tech stories the most outlets are covering, in Techmeme's order
 *   hackerNews    the Hacker News front page, with points, comments and age
 *   googleNews    the last 24 hours of AI news as covered in India
 *   hfPapers      today's most upvoted AI papers on Hugging Face (early, often under the radar)
 *   githubTrending  repos gaining stars fastest today
 *
 * Writes one JSON object: { fetchedAt, status: { source: "ok (n)" | "failed: why" }, ...sources }.
 */

const SUBREDDITS = ['singularity', 'OpenAI', 'ChatGPT', 'LocalLLaMA'];
const TELEGRAM_CHANNELS = ['aipost', 'hiaimediaen', 'CoreAti'];

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

  async reddit(notes) {
    const out = [];
    for (const sub of SUBREDDITS) {
      try {
        const data = await get(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=10`, 'json');
        out.push(...data.data.children.map(({ data: d }) => ({
          sub,
          title: d.title,
          score: d.score,
          comments: d.num_comments,
          link: d.url,
          discussion: `https://www.reddit.com${d.permalink}`,
        })));
      } catch (e) {
        try {
          const xml = await get(`https://www.reddit.com/r/${sub}/top/.rss?t=day&limit=10`);
          out.push(...items(xml, 'entry').slice(0, 10).map((b) => ({
            sub,
            title: tag(b, 'title'),
            discussion: (b.match(/<link[^>]*href="([^"]+)"/) || [])[1],
          })));
        } catch (e2) {
          notes.push(`r/${sub} failed: ${e2.message}`);
        }
      }
    }
    return out;
  },

  async telegram(notes) {
    const out = [];
    const since = Date.now() - 36 * 3600 * 1000;
    for (const ch of TELEGRAM_CHANNELS) {
      try {
        const html = await get(`https://t.me/s/${ch}`);
        const posts = html.split('tgme_widget_message_wrap').slice(1).map((b) => ({
          channel: ch,
          text: decode((b.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').slice(0, 400),
          views: (b.match(/tgme_widget_message_views">([^<]+)</) || [])[1] || '',
          date: (b.match(/<time[^>]*datetime="([^"]+)"/) || [])[1] || '',
          link: `https://t.me/${(b.match(/data-post="([^"]+)"/) || [])[1] || ch}`,
        }));
        const fresh = posts.filter((p) => p.text && (!p.date || Date.parse(p.date) >= since));
        if (!fresh.length) notes.push(`${ch}: no posts in the last 36 hours`);
        out.push(...fresh.slice(-15));
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
