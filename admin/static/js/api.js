export function createApiClient(token) {
  const base = "/admin/api";

  async function request(path, options = {}) {
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };

    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${base}${path}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const message =
        (data && data.error) ||
        (data && data.message) ||
        `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  }

  return {
    getConfig: () => request("/config"),
    updateConfig: (updates) =>
      request("/config", {
        method: "PUT",
        body: JSON.stringify({ updates }),
      }),
    getStatus: () => request("/service/status"),
  };
}
