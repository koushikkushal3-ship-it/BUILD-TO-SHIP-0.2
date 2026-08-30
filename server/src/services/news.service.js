import { supabaseAdmin } from '../lib/supabaseClient.js';

// Free-tier news aggregators, tried in order until one returns results.
// Each has a small daily quota (GNews 100/day, NewsData 200 credits/day,
// Currents ~600/day, Mediastack 100/month) — trying them as a fallback
// chain instead of calling all four every time means a normal request only
// spends one provider's quota, and a dead/exhausted key just falls through
// to the next rather than breaking the feed.
const INDUSTRY_QUERY = 'technology company OR AI OR software engineering hiring';
const CACHE_TTL_MS = 15 * 60 * 1000;

let industryCache = { data: null, expiresAt: 0 };
let communityCache = { data: null, expiresAt: 0 };

async function fetchGNews(query) {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return [];
  const url = `https://gnews.io/api/v4/search?${new URLSearchParams({ q: query, lang: 'en', max: '12', apikey: key })}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.articles || []).map((a) => ({
    title: a.title,
    url: a.url,
    description: a.description,
    imageUrl: a.image || null,
    publishedAt: a.publishedAt,
    source: a.source?.name || 'GNews',
  }));
}

async function fetchNewsData(query) {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return [];
  const url = `https://newsdata.io/api/1/news?${new URLSearchParams({ apikey: key, q: query, language: 'en' })}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (data.status !== 'success') return [];
  return (data.results || []).map((a) => ({
    title: a.title,
    url: a.link,
    description: a.description,
    imageUrl: a.image_url || null,
    publishedAt: a.pubDate,
    source: a.source_id || 'NewsData',
  }));
}

async function fetchCurrents(query) {
  const key = process.env.CURRENTS_API_KEY;
  if (!key) return [];
  const url = `https://api.currentsapi.services/v1/search?${new URLSearchParams({ keywords: query, language: 'en', apiKey: key })}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (data.status !== 'ok') return [];
  return (data.news || []).map((a) => ({
    title: a.title,
    url: a.url,
    description: a.description,
    imageUrl: a.image && a.image !== 'None' ? a.image : null,
    publishedAt: a.published,
    source: a.author || 'Currents',
  }));
}

async function fetchMediastack(query) {
  const key = process.env.MEDIASTACK_API_KEY;
  if (!key) return [];
  // Free-tier Mediastack only supports plain HTTP, not HTTPS.
  const url = `http://api.mediastack.com/v1/news?${new URLSearchParams({ access_key: key, keywords: query, languages: 'en' })}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (data.error) return [];
  return (data.data || []).map((a) => ({
    title: a.title,
    url: a.url,
    description: a.description,
    imageUrl: a.image || null,
    publishedAt: a.published_at,
    source: a.source || 'Mediastack',
  }));
}

const PROVIDERS = [fetchGNews, fetchNewsData, fetchCurrents, fetchMediastack];

export async function getIndustryNews() {
  if (industryCache.data && Date.now() < industryCache.expiresAt) return industryCache.data;

  let articles = [];
  for (const fetchProvider of PROVIDERS) {
    try {
      articles = await fetchProvider(INDUSTRY_QUERY);
      if (articles.length) break;
    } catch {
      // Try the next provider — a single dead/exhausted key shouldn't sink
      // the whole feed.
    }
  }

  industryCache = { data: articles, expiresAt: Date.now() + CACHE_TTL_MS };
  return articles;
}

const SUBREDDITS = ['artificial', 'MachineLearning', 'technology'];

async function fetchSubreddit(subreddit) {
  try {
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=15`, {
      headers: { 'User-Agent': 'crucible-interview-app/1.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.children || []).map(({ data: post }) => ({
      title: post.title,
      url: post.url_overridden_by_dest?.startsWith('http')
        ? post.url_overridden_by_dest
        : `https://www.reddit.com${post.permalink}`,
      description: null,
      imageUrl: post.thumbnail?.startsWith('http') ? post.thumbnail : null,
      publishedAt: new Date(post.created_utc * 1000).toISOString(),
      source: `r/${subreddit}`,
    }));
  } catch {
    return [];
  }
}

export async function getCommunityFeed() {
  if (communityCache.data && Date.now() < communityCache.expiresAt) return communityCache.data;

  const perSubreddit = await Promise.all(SUBREDDITS.map(fetchSubreddit));
  const merged = perSubreddit.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  communityCache = { data: merged, expiresAt: Date.now() + CACHE_TTL_MS };
  return merged;
}

export async function saveArticle({ userId, title, url, description, imageUrl, source, publishedAt, feed }) {
  const { data, error } = await supabaseAdmin
    .from('saved_articles')
    // Re-saving an already-saved url (e.g. a stale button state after a
    // refresh) should succeed idempotently rather than 409 on the unique
    // (user_id, url) constraint.
    .upsert(
      { user_id: userId, title, url, description, image_url: imageUrl, source, published_at: publishedAt, feed },
      { onConflict: 'user_id,url' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function unsaveArticle({ userId, url }) {
  const { error } = await supabaseAdmin.from('saved_articles').delete().eq('user_id', userId).eq('url', url);
  if (error) throw error;
}

export async function getSavedArticles(userId) {
  const { data, error } = await supabaseAdmin
    .from('saved_articles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
