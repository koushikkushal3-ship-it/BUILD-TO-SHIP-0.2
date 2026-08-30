import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ArrowUpRight, MessageSquare, ArrowBigUp, Bookmark, BookmarkCheck } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import Spinner from '../components/Spinner.jsx';

// Hacker News' Algolia-backed search API needs no key and has no rate limit
// worth worrying about here. "Company & Industry" and "Community" are proxied
// through the backend since they need real API keys (GNews/NewsData/Currents/
// Mediastack, tried in that fallback order) or a server-side fetch (Reddit —
// its public .json endpoints block most cloud/datacenter IPs outright,
// regardless of headers, so that tab may come back empty depending on where
// this is hosted; it degrades to an empty list rather than erroring).
const HN_FEEDS = {
  trending: { label: 'Trending in Tech', url: 'https://hn.algolia.com/api/v1/search?tags=front_page' },
  ai: { label: 'AI News', url: 'https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&numericFilters=points%3E10' },
};
const BACKEND_FEEDS = {
  industry: { label: 'Company & Industry', path: '/news/industry' },
  community: { label: 'Community', path: '/news/community' },
};
const TABS = [...Object.entries(HN_FEEDS), ...Object.entries(BACKEND_FEEDS), ['saved', { label: 'Saved' }]].map(
  ([key, { label }]) => ({ key, label })
);

function timeAgo(isoOrUnix) {
  const timestampMs = typeof isoOrUnix === 'number' ? isoOrUnix * 1000 : new Date(isoOrUnix).getTime();
  if (Number.isNaN(timestampMs)) return '';
  const seconds = Math.floor((Date.now() - timestampMs) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, secondsPerUnit] of units) {
    const count = Math.floor(seconds / secondsPerUnit);
    if (count >= 1) return `${count} ${name}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

// Every feed normalizes into this shape so one card component and one save
// flow can handle Hacker News, the backend-proxied feeds, and saved articles
// alike — `url` is the stable identity used for saving/unsaving.
function normalizeHnHit(hit) {
  return {
    title: hit.title,
    url: hit.url,
    description: null,
    imageUrl: null,
    source: 'Hacker News',
    publishedAt: new Date(hit.created_at_i * 1000).toISOString(),
    points: hit.points,
    numComments: hit.num_comments || 0,
    author: hit.author,
  };
}

function normalizeBackendArticle(article) {
  return { ...article, points: null, numComments: null, author: null };
}

export default function News() {
  const [tab, setTab] = useState('trending');
  const [stories, setStories] = useState(null);
  const [error, setError] = useState('');
  const [savedUrls, setSavedUrls] = useState(new Set());
  const [savedArticles, setSavedArticles] = useState(null);

  useEffect(() => {
    apiClient
      .get('/news/saved')
      .then(({ data }) => {
        setSavedArticles(data.saved);
        setSavedUrls(new Set(data.saved.map((a) => a.url)));
      })
      .catch(() => setSavedArticles([]));
  }, []);

  useEffect(() => {
    if (tab === 'saved') return;
    let cancelled = false;
    setStories(null);
    setError('');

    const load = HN_FEEDS[tab]
      ? fetch(HN_FEEDS[tab].url)
          .then((res) => {
            if (!res.ok) throw new Error('Request failed');
            return res.json();
          })
          .then((data) => data.hits.filter((h) => h.title && h.url).map(normalizeHnHit))
      : apiClient.get(BACKEND_FEEDS[tab].path).then(({ data }) => data.articles.map(normalizeBackendArticle));

    load
      .then((normalized) => {
        if (!cancelled) setStories(normalized);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load news right now — try again in a moment.");
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  async function toggleSave(story) {
    const isSaved = savedUrls.has(story.url);
    const nextUrls = new Set(savedUrls);
    if (isSaved) {
      nextUrls.delete(story.url);
      setSavedUrls(nextUrls);
      setSavedArticles((prev) => (prev || []).filter((a) => a.url !== story.url));
      apiClient.delete('/news/saved', { data: { url: story.url } }).catch(() => {
        // Revert on failure so the button doesn't lie about saved state.
        setSavedUrls(new Set(nextUrls).add(story.url));
      });
    } else {
      nextUrls.add(story.url);
      setSavedUrls(nextUrls);
      try {
        const { data } = await apiClient.post('/news/saved', {
          title: story.title,
          url: story.url,
          description: story.description,
          imageUrl: story.imageUrl,
          source: story.source,
          publishedAt: story.publishedAt,
          feed: tab,
        });
        setSavedArticles((prev) => [data.saved, ...(prev || [])]);
      } catch {
        const reverted = new Set(nextUrls);
        reverted.delete(story.url);
        setSavedUrls(reverted);
      }
    }
  }

  const displayed =
    tab === 'saved'
      ? (savedArticles || []).map((a) => ({ ...a, imageUrl: a.image_url, publishedAt: a.published_at, points: null, numComments: null }))
      : stories;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-2.5">
        <Newspaper size={22} className="text-amber-400" />
        <h1 className="font-display text-2xl font-semibold text-slate-100">News</h1>
      </div>
      <p className="mt-2 text-slate-400">
        What's moving in tech and AI right now — useful context for interview small talk and "why this role"
        answers.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === key ? 'bg-amber-500 text-neutral-900' : 'bg-charcoal-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {tab !== 'saved' && error && <p className="text-sm text-slate-500">{error}</p>}
        {tab !== 'saved' && !error && stories === null && <Spinner label="Loading news…" />}
        {tab === 'saved' && savedArticles === null && <Spinner label="Loading saved articles…" />}
        {displayed?.length === 0 && (
          <p className="text-sm text-slate-500">
            {tab === 'saved' ? "You haven't saved any articles yet." : 'No stories found right now.'}
          </p>
        )}

        {displayed?.map((story, i) => (
          <motion.div
            key={story.url}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="card-interactive flex items-start justify-between gap-3"
          >
            <a href={story.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
              <p className="font-medium text-slate-100">{story.title}</p>
              {story.description && <p className="mt-1 line-clamp-2 text-sm text-slate-400">{story.description}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {story.points !== null && (
                  <span className="flex items-center gap-1">
                    <ArrowBigUp size={13} /> {story.points}
                  </span>
                )}
                {story.numComments !== null && (
                  <span className="flex items-center gap-1">
                    <MessageSquare size={13} /> {story.numComments}
                  </span>
                )}
                {story.publishedAt && <span>{timeAgo(story.publishedAt)}</span>}
                {(story.author || story.source) && <span>{story.author ? `by ${story.author}` : story.source}</span>}
              </div>
            </a>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toggleSave(story)}
                aria-label={savedUrls.has(story.url) ? 'Unsave article' : 'Save article'}
                className="text-slate-500 hover:text-amber-400"
              >
                {savedUrls.has(story.url) ? (
                  <BookmarkCheck size={17} className="text-amber-400" />
                ) : (
                  <Bookmark size={17} />
                )}
              </button>
              <a href={story.url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-400">
                <ArrowUpRight size={16} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
