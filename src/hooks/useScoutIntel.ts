import { useState, useEffect } from "react";
import { getLatestScoutIntel } from "@/lib/api";
import type { ScoutingRun } from "@/types";

interface ScoutIntelState {
  run: ScoutingRun | null;
  loading: boolean;
  error: string | null;
}

export function useScoutIntel(): ScoutIntelState {
  const [run, setRun] = useState<ScoutingRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLatestScoutIntel();
        setRun(data as ScoutingRun | null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { run, loading, error };
}
