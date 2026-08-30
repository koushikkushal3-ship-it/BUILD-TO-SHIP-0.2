const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

// Real search results, not AI-hallucinated links — this is what makes the app
// teach, not just grade. Returns [] on any failure so a resource-lookup hiccup
// never breaks the interview flow.
export async function findLearningResources(skillTag, maxResults = 3) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    part: 'snippet',
    q: `${skillTag} interview tips`,
    type: 'video',
    maxResults: String(maxResults),
    relevanceLanguage: 'en',
    safeSearch: 'strict',
    key: apiKey,
  });

  try {
    const res = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items || []).map((item) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || null,
    }));
  } catch {
    return [];
  }
}
