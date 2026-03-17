import { useState, useEffect, useCallback } from "react";
import { getUserSettings, updateUserSettings as updateUserSettingsApi } from "@/lib/api";

const SESSION_KEY = "dawnsignal_session_id";
const DEFAULT_TZ = "Europe/London";

function getOrCreateSessionId(): string {
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

export interface UserSettings {
  timezone: string;
}

export interface UserSettingsState {
  settings: UserSettings;
  loading: boolean;
  updateTimezone: (tz: string) => Promise<void>;
}

export function useUserSettings(): UserSettingsState {
  const [settings, setSettings] = useState<UserSettings>({ timezone: DEFAULT_TZ });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUserSettings();
        if (data?.timezone) {
          setSettings({ timezone: data.timezone });
        }
      } catch (err) {
        // fallback to default
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateTimezone = useCallback(async (tz: string) => {
    setSettings({ timezone: tz });
    await updateUserSettingsApi({ timezone: tz }).catch(err => console.error(err));
  }, []);

  return { settings, loading, updateTimezone };
}
