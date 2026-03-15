import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "dawnsignal_session_id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
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
    const sessionId = getSessionId();
    const today = todayUTC();
    (async () => {
      try {
        const { data } = await supabase
          .from("action_completions")
          .select("action_id")
          .eq("session_id", sessionId)
          .eq("completed_date", today);
        if (data) {
          setCompleted(data.map((r) => r.action_id));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = useCallback(async (actionId: string) => {
    const sessionId = getSessionId();
    const today = todayUTC();
    const isCompleted = completed.includes(actionId);

    if (isCompleted) {
      setCompleted((prev) => prev.filter((id) => id !== actionId));
      await supabase
        .from("action_completions")
        .delete()
        .eq("session_id", sessionId)
        .eq("action_id", actionId)
        .eq("completed_date", today);
    } else {
      setCompleted((prev) => [...prev, actionId]);
      await supabase.from("action_completions").upsert(
        {
          session_id: sessionId,
          action_id: actionId,
          completed_date: today,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "session_id,action_id,completed_date" }
      );
    }
  }, [completed]);

  return { completed, loading, toggle };
}
