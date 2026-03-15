import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
      const { data, error: err } = await supabase
        .from("scouting_runs")
        .select("*")
        .not("completed_at", "is", null)
        .order("run_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (err) {
        setError(err.message);
      } else {
        setRun(data as ScoutingRun | null);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { run, loading, error };
}
