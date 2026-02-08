const DEFAULT_BASE = import.meta.env.VITE_API_BASE || "/api";

function joinUrl(base, path) {
  if (!path) return base;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return base.replace(/\/$/, "") + path;
  return base.replace(/\/$/, "") + "/" + path;
}

async function readJson(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createApi({
  baseUrl = DEFAULT_BASE,
  getAccessToken,
  getRefreshToken,
  setTokens,
  onAuthFail,
} = {}) {
  let refreshPromise = null;

  async function refreshAccess() {
    if (!getRefreshToken) return false;
    const refresh = getRefreshToken();
    if (!refresh) return false;
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const res = await fetch(joinUrl(baseUrl, "/token/refresh/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) {
          return false;
        }
        const data = await readJson(res);
        if (data?.access) {
          if (setTokens) {
            setTokens({ access: data.access, refresh });
          }
          return true;
        }
        return false;
      })();
    }

    const ok = await refreshPromise;
    refreshPromise = null;
    return ok;
  }

  async function request(path, options = {}) {
    const {
      method = "GET",
      body,
      headers = {},
      retry = true,
    } = options;

    const requestHeaders = { ...headers };
    const accessToken = getAccessToken ? getAccessToken() : null;
    if (accessToken) {
      requestHeaders.Authorization = `Bearer ${accessToken}`;
    }

    let payload = body;
    if (body && !(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    const response = await fetch(joinUrl(baseUrl, path), {
      method,
      headers: requestHeaders,
      body: payload,
    });

    if (response.status === 401 && retry) {
      const refreshed = await refreshAccess();
      if (refreshed) {
        return request(path, { ...options, retry: false });
      }
      if (onAuthFail) onAuthFail();
    }

    // Token is still invalid after a refresh attempt; force sign-out.
    if (response.status === 401 && !retry && onAuthFail) {
      onAuthFail();
    }

    const data = await readJson(response);
    if (!response.ok) {
      const error = new Error("Request failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  return {
    request,
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body }),
    patch: (path, body) => request(path, { method: "PATCH", body }),
    put: (path, body) => request(path, { method: "PUT", body }),
    del: (path, body) => request(path, { method: "DELETE", body }),
  };
}
