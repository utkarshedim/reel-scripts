/**
 * Reel discovery: collects today's raw signals from free sources that need no key.
 *
 *   node scripts/discover.mjs > /tmp/discovery.json
 *
 * Sources, each fetched on its own so one failing never stops the rest:
 *   techmeme      the tech stories the most outlets are covering, in Techmeme's order
 *   hackerNews    the Hacker News front page, with points, comments and age
 *   googleTrends  what India is searching for today, with search volume and news links
 *   googleTrendsUS  the same for the US, where most tech stories start
 *   googleNews    the last 24 hours of AI and tech news as covered in India
 *   googleNewsTech  Google News India's top Technology stories: what the public is following,
 *                 including big stories that are still developing after a few days
 *   hfPapers      today's most upvoted AI papers on Hugging Face (early, often under the radar)
 *   productHunt   today's product launches (new tools people can try)
 *   githubTrending  repos gaining stars fastest today
 *
 * Writes one JSON object: { fetchedAt, status: { source: "ok (n)" | "failed: why" }, ...sources }.
 */

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

async function trends(geo) {
  return items(await get(`https://trends.google.com/trending/rss?geo=${geo}`)).slice(0, 30).map((b) => ({
      query: tag(b, 'title'),
      searches: tag(b, 'ht:approx_traffic'),
      started: tag(b, 'pubDate'),
      news: items(b, 'ht:news_item').slice(0, 2).map((n) => ({
        title: tag(n, 'ht:news_item_title'),
        url: tag(n, 'ht:news_item_url'),
        outlet: tag(n, 'ht:news_item_source'),
      })),
    }));
}

const sources = {
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

  googleTrends: () => trends('IN'),
  googleTrendsUS: () => trends('US'),

  async googleNewsTech() {
    const url = 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en';
    return items(await get(url)).slice(0, 40).map((b) => ({
      title: tag(b, 'title'),
      link: tag(b, 'link'),
      outlet: tag(b, 'source'),
      published: tag(b, 'pubDate'),
    }));
  },

  async googleNews() {
    const q = encodeURIComponent('(AI OR "artificial intelligence" OR OpenAI OR Google OR Apple OR smartphone OR startup) when:1d');
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

  async productHunt() {
    const xml = await get('https://www.producthunt.com/feed');
    const entries = items(xml, 'entry').length ? items(xml, 'entry') : items(xml);
    return entries.slice(0, 20).map((b) => ({
      title: tag(b, 'title'),
      link: (b.match(/<link[^>]*href="([^"]+)"/) || [])[1] || tag(b, 'link'),
      summary: (tag(b, 'content') || tag(b, 'description') || '').slice(0, 250),
    }));
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
    try {
      const list = await fn();
      out[name] = list;
      out.status[name] = list.length ? `ok (${list.length})` : 'failed: empty';
    } catch (e) {
      out[name] = [];
      out.status[name] = `failed: ${e.message}`;
    }
  }),
);
console.log(JSON.stringify(out, null, 1));
console.error(Object.entries(out.status).map(([k, v]) => `  ${k.padEnd(15)} ${v}`).join('\n'));
