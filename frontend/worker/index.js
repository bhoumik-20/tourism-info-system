// Hosting bridge only: Express remains responsible for SQL and Oracle rules.
const json = (error, status) => Response.json({ error }, {
  status, headers: { "Cache-Control": "no-store" },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (!["GET", "HEAD", "POST", "PUT", "DELETE"].includes(request.method)) {
      return json("This request method is not supported.", 405);
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      // Profiles are a classroom switcher. This check prevents cross-site writes;
      // Sites access controls decide who may visit the testing website.
      if (request.headers.get("Origin") !== url.origin ||
          request.headers.get("Sec-Fetch-Site") === "cross-site") {
        return json("Open Voyage to make this change.", 403);
      }
      if (request.method !== "DELETE" &&
          !request.headers.get("Content-Type")?.startsWith("application/json")) {
        return json("Send application/json for this change.", 415);
      }
    }
    if (!env.VOYAGE_BACKEND_URL || !env.VOYAGE_TUNNEL_KEY) {
      return json("The team testing connection has not been configured yet.", 503);
    }
    try {
      const target = new URL(env.VOYAGE_BACKEND_URL);
      if (target.protocol !== "https:") return json("The testing connection needs HTTPS.", 503);
      target.pathname = url.pathname;
      target.search = url.search;
      const headers = new Headers({ "X-Voyage-Tunnel-Key": env.VOYAGE_TUNNEL_KEY });
      const contentType = request.headers.get("Content-Type");
      if (contentType) headers.set("Content-Type", contentType);
      const upstream = await fetch(target, {
        method: request.method, headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        redirect: "manual", signal: AbortSignal.timeout(20000),
      });
      // Do not return tunnel pages, credentials, cookies or upstream headers.
      if (upstream.status >= 500 || upstream.status >= 300 && upstream.status < 400 ||
          upstream.status !== 204 && !upstream.headers.get("Content-Type")?.includes("application/json")) {
        return json("The host PC is unavailable. Ask the project owner to start Oracle, the backend and the team tunnel, then try again.", 503);
      }
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      });
    } catch {
      return json("The host PC is unavailable. Ask the project owner to start Oracle, the backend and the team tunnel, then try again.", 503);
    }
  },
};
