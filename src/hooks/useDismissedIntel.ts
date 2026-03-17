import { useState, useEffect, useCallback } from 'react';
import { getDismissedIntel, dismissIntel, revertDismissedIntel, getUser } from '@/lib/api';
import type { TopicIntelligence } from '@/types';

export interface DismissedIntelRecord {
  id: string;
  type: 'scout_topic' | 'news_story';
  ref_id: string;
  ref_label: string;
  category: string | null;
  signal: string | null;
  reason: string | null;
  dismissed_by: string | null;
  dismissed_at: string;
  scouting_run_id: string | null;
}

interface UseDismissedIntelReturn {
  dismissed: DismissedIntelRecord[];
  loading: boolean;
  dismissTopic: (topic: TopicIntelligence, runId: string, reason?: string) => Promise<void>;
  dismissStory: (refId: string, title: string) => Promise<void>;
  undismiss: (id: string) => Promise<void>;
  isDismissed: (type: 'scout_topic' | 'news_story', refId: string) => boolean;
}

export function useDismissedIntel(): UseDismissedIntelReturn {
  const [dismissed, setDismissed] = useState<DismissedIntelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [scoutIds, storyIds] = await Promise.all([
           getDismissedIntel('scout_topic'),
           getDismissedIntel('news_story')
        ]);
        
        const mappedScout: DismissedIntelRecord[] = scoutIds.map(id => ({
           id, type: 'scout_topic', ref_id: id, ref_label: '', category: null, signal: null, reason: null, dismissed_by: null, dismissed_at: new Date().toISOString(), scouting_run_id: null
        }));
        const mappedStories: DismissedIntelRecord[] = storyIds.map(id => ({
           id, type: 'news_story', ref_id: id, ref_label: '', category: null, signal: null, reason: null, dismissed_by: null, dismissed_at: new Date().toISOString(), scouting_run_id: null
        }));

        setDismissed([...mappedScout, ...mappedStories]);
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dismissTopic = useCallback(async (topic: TopicIntelligence, runId: string, reason?: string) => {
    const { user } = await getUser().catch(() => ({ user: null }));
    if (!user) return;

    const record = {
      type: 'scout_topic' as const,
      ref_id: topic.topic_id,
      ref_label: topic.topic_label,
      category: topic.category,
      signal: topic.signal,
      reason: reason ?? null,
      dismissed_by: user.id,
      scouting_run_id: runId,
    };

    try {
      const { id } = await dismissIntel(record);
      setDismissed(prev => [{ ...record, id, dismissed_at: new Date().toISOString() } as DismissedIntelRecord, ...prev]);
    } catch(err) {
      console.error(err);
    }
  }, []);

  const dismissStory = useCallback(async (refId: string, title: string) => {
    const { user } = await getUser().catch(() => ({ user: null }));
    if (!user) return;

    const record = {
      type: 'news_story' as const,
      ref_id: refId,
      ref_label: title,
      category: null,
      signal: null,
      reason: null,
      dismissed_by: user.id,
      scouting_run_id: null,
    };

    try {
      const { id } = await dismissIntel(record);
      setDismissed(prev => [{ ...record, id, dismissed_at: new Date().toISOString() } as DismissedIntelRecord, ...prev]);
    } catch(err) {
      console.error(err);
    }
  }, []);

  const undismiss = useCallback(async (id: string) => {
    const record = dismissed.find(d => d.id === id);
    if (!record) return;

    try {
      await revertDismissedIntel(record.type, record.ref_id);
      setDismissed(prev => prev.filter(d => d.id !== id));
    } catch(err) {
      console.error(err);
    }
  }, [dismissed]);

  const isDismissed = useCallback((type: 'scout_topic' | 'news_story', refId: string): boolean => {
    return dismissed.some(d => d.type === type && d.ref_id === refId);
  }, [dismissed]);

  return { dismissed, loading, dismissTopic, dismissStory, undismiss, isDismissed };
}
