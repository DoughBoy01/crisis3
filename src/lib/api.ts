// src/lib/api.ts

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:8788/api' : '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.method !== 'GET' && options.method !== 'DELETE') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Essential for HttpOnly session cookies
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // Ignore JSON parse errors for fallback message
    }
    throw new ApiError(response.status, errorMsg);
  }

  // Handle empty responses (e.g. 204 No Content for logout)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  try {
    return await response.json() as T;
  } catch (err) {
    return {} as T;
  }
}

// ----------------------------------------------------
// Auth Endpoints
// ----------------------------------------------------

export async function login(email: string, password: string):Promise<{ user: any }> {
  return fetchApi<{ user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function logout(): Promise<void> {
  await fetchApi('/auth/logout', { method: 'POST' });
}

export async function updatePassword(password: string): Promise<void> {
  await fetchApi('/auth/update_password', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
}

export async function getUser(): Promise<{ user: any }> {
  return fetchApi<{ user: any }>('/auth/me', { method: 'GET' });
}

// ----------------------------------------------------
// Feed Cache
// ----------------------------------------------------

export async function getFeedCache(): Promise<any[]> {
  return fetchApi<any[]>('/feed_cache', { method: 'GET' });
}

// ----------------------------------------------------
// User Settings
// ----------------------------------------------------

export async function getUserSettings(): Promise<any> {
  return fetchApi<any>('/user_settings', { method: 'GET' });
}

export async function updateUserSettings(settings: { timezone?: string }): Promise<void> {
  await fetchApi('/user_settings', {
    method: 'PATCH',
    body: JSON.stringify(settings)
  });
}

// ----------------------------------------------------
// Daily Brief
// ----------------------------------------------------

export async function getDailyBrief(): Promise<any> {
  return fetchApi<any>('/daily_brief', { method: 'GET' });
}

// ----------------------------------------------------
// Action Completions
// ----------------------------------------------------
export async function getActionCompletions(): Promise<string[]> {
  return fetchApi<string[]>('/action_completions', { method: 'GET' });
}
export async function completeAction(actionId: string, completed: boolean): Promise<void> {
  await fetchApi('/action_completions', {
    method: 'POST',
    body: JSON.stringify({ action_id: actionId, completed })
  });
}

// ----------------------------------------------------
// Historical Context
// ----------------------------------------------------
export async function getHistoricalContext(type: 'percentiles' | 'seasonality' | 'conflicts'): Promise<any[]> {
  return fetchApi<any[]>(`/historical_context?type=${type}`, { method: 'GET' });
}

// ----------------------------------------------------
// Dismissed Intel
// ----------------------------------------------------
export async function getDismissedIntel(type: 'scout_topic' | 'news_story'): Promise<string[]> {
  return fetchApi<string[]>(`/dismissed_intel?type=${type}`, { method: 'GET' });
}
export async function dismissIntel(payload: any): Promise<any> {
  return fetchApi('/dismissed_intel', { method: 'POST', body: JSON.stringify(payload) });
}
export async function revertDismissedIntel(type: 'scout_topic' | 'news_story', refId: string): Promise<void> {
  await fetchApi(`/dismissed_intel?type=${type}&ref_id=${encodeURIComponent(refId)}`, { method: 'DELETE' });
}

// ----------------------------------------------------
// Daily Diff
// ----------------------------------------------------
export async function getDailyBriefDiffs(persona: string, limit: number): Promise<any[]> {
  return fetchApi<any[]>(`/daily_diff?persona=${persona}&limit=${limit}`, { method: 'GET' });
}

// ----------------------------------------------------
// Scout Intel
// ----------------------------------------------------
export async function getLatestScoutIntel(): Promise<any> {
  return fetchApi<any>('/scout_intel', { method: 'GET' });
}

// ----------------------------------------------------
// Daily Brief Admin Preview
// ----------------------------------------------------
export async function getDailyBriefDates(): Promise<{ brief_date: string }[]> {
  return fetchApi<{ brief_date: string }[]>('/daily_brief/dates', { method: 'GET' });
}

export async function getDailyBriefPreview(date: string, persona: string): Promise<any> {
  return fetchApi<any>(`/daily_brief/preview?date=${date}&persona=${persona}`, { method: 'GET' });
}

// ----------------------------------------------------
// Delete Story (Admin)
// ----------------------------------------------------
export async function deleteStory(payload: { feedFetchedAt: string; sourceName: string; storyLink: string }): Promise<void> {
  await fetchApi('/delete_story', { method: 'POST', body: JSON.stringify(payload) });
}

// ----------------------------------------------------
// Agent Run History
// ----------------------------------------------------
export async function getAgentRunHistory(): Promise<any[]> {
  return fetchApi<any[]>('/agent_run_history', { method: 'GET' });
}
