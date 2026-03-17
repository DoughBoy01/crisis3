import { useState, useEffect, useCallback } from "react";
import { getActionCompletions, completeAction } from "@/lib/api";

const SESSION_KEY = "dawnsignal_session_id";

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UseActionCompletionsResult {
  completed: string[];
  loading: boolean;
  toggle: (actionId: string) => Promise<void>;
}

export function useActionCompletions(): UseActionCompletionsResult {
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const completedIds = await getActionCompletions();
        if (completedIds) {
          setCompleted(completedIds);
        }
      } catch (err) {
        console.error("Error fetching action completions:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = useCallback(async (actionId: string) => {
    const isCompleted = completed.includes(actionId);

    if (isCompleted) {
      setCompleted((prev) => prev.filter((id) => id !== actionId));
      await completeAction(actionId, false).catch(err => console.error(err));
    } else {
      setCompleted((prev) => [...prev, actionId]);
      await completeAction(actionId, true).catch(err => console.error(err));
    }
  }, [completed]);

  return { completed, loading, toggle };
}
