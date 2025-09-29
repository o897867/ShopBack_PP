import { useCallback, useEffect, useState } from 'react';
import cfdService from '../services/cfdService.js';
import { API_BASE_URL } from '../config/api.js';

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

const useBrokerHubData = () => {
  const [brokers, setBrokers] = useState([]);
  const [brokerNews, setBrokerNews] = useState([]);
  const [threads, setThreads] = useState([]);
  const [threadHighlights, setThreadHighlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Current location:', window.location.origin);
    try {
      const brokerList = await cfdService.getBrokers();
      const topBrokerNews = await Promise.all(
        brokerList.slice(0, 3).map(async (broker) => {
          try {
            const items = await cfdService.getBrokerNews(broker.id);
            return items.map((item) => ({
              ...item,
              brokerId: broker.id,
              brokerName: broker.name
            }));
          } catch {
            return [];
          }
        })
      );

      const threadsList = await fetchJson(`${API_BASE_URL}/api/forum/threads?limit=12`);
      const highlightList = await Promise.all(
        threadsList.slice(0, 3).map(async (thread) => {
          try {
            const detail = await fetchJson(`${API_BASE_URL}/api/forum/threads/${thread.id}?page_size=50`);
            const posts = detail.posts || [];
            const participantNames = new Set();
            if (thread.author_name) participantNames.add(thread.author_name);
            posts.forEach((post) => {
              if (post.author_name) {
                participantNames.add(post.author_name);
              }
            });
            const lastPost = posts.length > 0 ? posts[posts.length - 1] : null;
            return {
              ...thread,
              postsCount: posts.length,
              participantNames: Array.from(participantNames),
              participantsCount: participantNames.size,
              lastActivity: lastPost?.created_at || thread.last_post_at || thread.created_at
            };
          } catch {
            const participantNames = thread.author_name ? [thread.author_name] : [];
            return {
              ...thread,
              postsCount: 0,
              participantNames,
              participantsCount: participantNames.length,
              lastActivity: thread.last_post_at || thread.created_at
            };
          }
        })
      );

      setBrokers(brokerList);
      setBrokerNews(topBrokerNews.flat());
      setThreads(threadsList);
      setThreadHighlights(highlightList);
    } catch (err) {
      setError(err.message || 'Failed to load broker hub data');
      setBrokers([]);
      setBrokerNews([]);
      setThreads([]);
      setThreadHighlights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    brokers,
    brokerNews,
    threads,
    threadHighlights,
    loading,
    error,
    refresh: load
  };
};

export default useBrokerHubData;
