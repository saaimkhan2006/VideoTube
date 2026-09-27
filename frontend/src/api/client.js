const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "vt_access";
const REFRESH_KEY = "vt_refresh";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/users/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const json = await res.json();
  const { accessToken, refreshToken: nextRefresh } = json.data || {};
  setTokens(accessToken, nextRefresh);
  return accessToken;
}

export async function api(
  path,
  { method = "GET", body, formData, auth = true, retry = true } = {}
) {
  const headers = {};
  if (!formData) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: formData ? formData : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const next = await refreshAccessToken();
    if (next) {
      return api(path, { method, body, formData, auth, retry: false });
    }
  }

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text || "Request failed" };
  }

  if (!res.ok) {
    const err = new Error(json?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

export const usersApi = {
  register: (formData) =>
    api("/users/register", { method: "POST", formData, auth: false }),
  login: (body) =>
    api("/users/login", { method: "POST", body, auth: false }),
  logout: () => api("/users/logout", { method: "POST" }),
  current: () => api("/users/current-user"),
  channel: (username) => api(`/users/c/${username}`),
  updateAccount: (body) =>
    api("/users/update-account", { method: "PATCH", body }),
  changePassword: (body) =>
    api("/users/change-password", { method: "POST", body }),
  updateAvatar: (formData) =>
    api("/users/avatar", { method: "PATCH", formData }),
  updateCover: (formData) =>
    api("/users/coverImage", { method: "PATCH", formData }),
  history: () => api("/users/history"),
};

export const videosApi = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, v);
    });
    const qs = q.toString();
    return api(`/videos${qs ? `?${qs}` : ""}`);
  },
  get: (id) => api(`/videos/${id}`),
  upload: (formData) => api("/videos/", { method: "POST", formData }),
  update: (id, formData) =>
    api(`/videos/${id}`, { method: "PATCH", formData }),
  remove: (id) => api(`/videos/${id}`, { method: "DELETE" }),
  togglePublish: (id) =>
    api(`/videos/toggle/publish/${id}`, { method: "PATCH" }),
};

export const commentsApi = {
  list: (videoId, page = 1, limit = 20) =>
    api(`/comments/${videoId}?page=${page}&limit=${limit}`, { auth: false }),
  add: (videoId, content) =>
    api(`/comments/${videoId}`, { method: "POST", body: { content } }),
  update: (commentId, content) =>
    api(`/comments/c/${commentId}`, {
      method: "PATCH",
      body: { content },
    }),
  remove: (commentId) =>
    api(`/comments/c/${commentId}`, { method: "DELETE" }),
};

export const likesApi = {
  toggleVideo: (videoId) =>
    api(`/likes/toggle/v/${videoId}`, { method: "POST" }),
  toggleComment: (commentId) =>
    api(`/likes/toggle/c/${commentId}`, { method: "POST" }),
  toggleTweet: (tweetId) =>
    api(`/likes/toggle/t/${tweetId}`, { method: "POST" }),
  videos: () => api("/likes/videos"),
};

export const subscriptionsApi = {
  subscribers: (channelId) =>
    api(`/subscriptions/u/${channelId}`, { auth: false }),
  channels: (subscriberId) =>
    api(`/subscriptions/c/${subscriberId}`, { auth: false }),
  toggle: (channelId) =>
    api(`/subscriptions/c/${channelId}`, { method: "POST" }),
};

export const playlistsApi = {
  create: (body) => api("/playlists/", { method: "POST", body }),
  get: (id) => api(`/playlists/${id}`),
  update: (id, body) => api(`/playlists/${id}`, { method: "PATCH", body }),
  remove: (id) => api(`/playlists/${id}`, { method: "DELETE" }),
  addVideo: (videoId, playlistId) =>
    api(`/playlists/add/${videoId}/${playlistId}`, { method: "PATCH" }),
  removeVideo: (videoId, playlistId) =>
    api(`/playlists/remove/${videoId}/${playlistId}`, { method: "PATCH" }),
  byUser: (userId) => api(`/playlists/user/${userId}`),
};

export const tweetsApi = {
  create: (content) =>
    api("/tweets/", { method: "POST", body: { content } }),
  byUser: (userId) => api(`/tweets/user/${userId}`),
  update: (tweetId, content) =>
    api(`/tweets/${tweetId}`, { method: "PATCH", body: { content } }),
  remove: (tweetId) => api(`/tweets/${tweetId}`, { method: "DELETE" }),
};

export const dashboardApi = {
  stats: () => api("/dashboard/stats"),
  videos: () => api("/dashboard/videos"),
};

export function formatViews(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export function formatDuration(seconds) {
  const s = Math.floor(Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
