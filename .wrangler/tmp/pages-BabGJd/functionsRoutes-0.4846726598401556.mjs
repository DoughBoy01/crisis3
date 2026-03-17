import { onRequestPost as __api_auth_login_ts_onRequestPost } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/auth/login.ts"
import { onRequestPost as __api_auth_logout_ts_onRequestPost } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/auth/logout.ts"
import { onRequestGet as __api_auth_me_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/auth/me.ts"
import { onRequestPost as __api_auth_update_password_ts_onRequestPost } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/auth/update_password.ts"
import { onRequestGet as __api_daily_brief_dates_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/daily_brief/dates.ts"
import { onRequestGet as __api_daily_brief_preview_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/daily_brief/preview.ts"
import { onRequestGet as __api_feed_cache_connect_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/feed_cache/connect.ts"
import { onRequestGet as __api_action_completions_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/action_completions/index.ts"
import { onRequestPost as __api_action_completions_index_ts_onRequestPost } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/action_completions/index.ts"
import { onRequestGet as __api_agent_run_history_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/agent_run_history/index.ts"
import { onRequestGet as __api_daily_brief_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/daily_brief/index.ts"
import { onRequestGet as __api_daily_diff_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/daily_diff/index.ts"
import { onRequestPost as __api_delete_story_index_ts_onRequestPost } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/delete_story/index.ts"
import { onRequestDelete as __api_dismissed_intel_index_ts_onRequestDelete } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/dismissed_intel/index.ts"
import { onRequestGet as __api_dismissed_intel_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/dismissed_intel/index.ts"
import { onRequestPost as __api_dismissed_intel_index_ts_onRequestPost } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/dismissed_intel/index.ts"
import { onRequestGet as __api_feed_cache_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/feed_cache/index.ts"
import { onRequestPost as __api_feed_cache_index_ts_onRequestPost } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/feed_cache/index.ts"
import { onRequestGet as __api_historical_context_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/historical_context/index.ts"
import { onRequestGet as __api_scout_intel_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/scout_intel/index.ts"
import { onRequestGet as __api_user_settings_index_ts_onRequestGet } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/user_settings/index.ts"
import { onRequestPatch as __api_user_settings_index_ts_onRequestPatch } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/api/user_settings/index.ts"
import { onRequest as ___middleware_ts_onRequest } from "/Users/stephenaris/Dawnsignal17_3/crisis2/functions/_middleware.ts"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_ts_onRequestGet],
    },
  {
      routePath: "/api/auth/update_password",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_update_password_ts_onRequestPost],
    },
  {
      routePath: "/api/daily_brief/dates",
      mountPath: "/api/daily_brief",
      method: "GET",
      middlewares: [],
      modules: [__api_daily_brief_dates_ts_onRequestGet],
    },
  {
      routePath: "/api/daily_brief/preview",
      mountPath: "/api/daily_brief",
      method: "GET",
      middlewares: [],
      modules: [__api_daily_brief_preview_ts_onRequestGet],
    },
  {
      routePath: "/api/feed_cache/connect",
      mountPath: "/api/feed_cache",
      method: "GET",
      middlewares: [],
      modules: [__api_feed_cache_connect_ts_onRequestGet],
    },
  {
      routePath: "/api/action_completions",
      mountPath: "/api/action_completions",
      method: "GET",
      middlewares: [],
      modules: [__api_action_completions_index_ts_onRequestGet],
    },
  {
      routePath: "/api/action_completions",
      mountPath: "/api/action_completions",
      method: "POST",
      middlewares: [],
      modules: [__api_action_completions_index_ts_onRequestPost],
    },
  {
      routePath: "/api/agent_run_history",
      mountPath: "/api/agent_run_history",
      method: "GET",
      middlewares: [],
      modules: [__api_agent_run_history_index_ts_onRequestGet],
    },
  {
      routePath: "/api/daily_brief",
      mountPath: "/api/daily_brief",
      method: "GET",
      middlewares: [],
      modules: [__api_daily_brief_index_ts_onRequestGet],
    },
  {
      routePath: "/api/daily_diff",
      mountPath: "/api/daily_diff",
      method: "GET",
      middlewares: [],
      modules: [__api_daily_diff_index_ts_onRequestGet],
    },
  {
      routePath: "/api/delete_story",
      mountPath: "/api/delete_story",
      method: "POST",
      middlewares: [],
      modules: [__api_delete_story_index_ts_onRequestPost],
    },
  {
      routePath: "/api/dismissed_intel",
      mountPath: "/api/dismissed_intel",
      method: "DELETE",
      middlewares: [],
      modules: [__api_dismissed_intel_index_ts_onRequestDelete],
    },
  {
      routePath: "/api/dismissed_intel",
      mountPath: "/api/dismissed_intel",
      method: "GET",
      middlewares: [],
      modules: [__api_dismissed_intel_index_ts_onRequestGet],
    },
  {
      routePath: "/api/dismissed_intel",
      mountPath: "/api/dismissed_intel",
      method: "POST",
      middlewares: [],
      modules: [__api_dismissed_intel_index_ts_onRequestPost],
    },
  {
      routePath: "/api/feed_cache",
      mountPath: "/api/feed_cache",
      method: "GET",
      middlewares: [],
      modules: [__api_feed_cache_index_ts_onRequestGet],
    },
  {
      routePath: "/api/feed_cache",
      mountPath: "/api/feed_cache",
      method: "POST",
      middlewares: [],
      modules: [__api_feed_cache_index_ts_onRequestPost],
    },
  {
      routePath: "/api/historical_context",
      mountPath: "/api/historical_context",
      method: "GET",
      middlewares: [],
      modules: [__api_historical_context_index_ts_onRequestGet],
    },
  {
      routePath: "/api/scout_intel",
      mountPath: "/api/scout_intel",
      method: "GET",
      middlewares: [],
      modules: [__api_scout_intel_index_ts_onRequestGet],
    },
  {
      routePath: "/api/user_settings",
      mountPath: "/api/user_settings",
      method: "GET",
      middlewares: [],
      modules: [__api_user_settings_index_ts_onRequestGet],
    },
  {
      routePath: "/api/user_settings",
      mountPath: "/api/user_settings",
      method: "PATCH",
      middlewares: [],
      modules: [__api_user_settings_index_ts_onRequestPatch],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]