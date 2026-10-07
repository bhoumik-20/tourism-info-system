import { createMockRepository } from "./mockRepository.js";
import { planBody } from "./catalog.js";

export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== "false";
const BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function request(path, method = "GET", body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${BASE}${path}`, {
      method,
      signal: controller.signal,
      headers: body ? { "Content-Type": "application/json" } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return null;
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error || `Request failed (${response.status}).`);
    return payload.data;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("The server took too long to respond. Please try again.");
    if (error instanceof TypeError)
      throw new Error(
        "Unable to reach the tourism server. Check that the backend is running.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// The existing API has pagination without a total count. Read successive pages;
// keep pagination and response-envelope handling out of components.
async function readAll(path, filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );
  const records = [];
  for (let page = 1; ; page++) {
    params.set("page", page);
    params.set("limit", 100);
    const batch = await request(`${path}?${params}`);
    records.push(...batch);
    if (batch.length < 100) return records;
  }
}
const subtypes = ["places", "restaurants", "activities", "events"];
function normalize(poi, type) {
  const found = type || subtypes.find((t) => poi[t]);
  return { ...poi, ...(poi[found] || {}), type: found || "places" };
}
const live = {
  async bootstrap(userId) {
    const [cities, users, lists] = await Promise.all([
      request("/cities"),
      request("/users"),
      Promise.all(
        subtypes.map(async (type) =>
          (await readAll(`/${type}`)).map((p) => normalize(p, type)),
        ),
      ),
    ]);
    const selectedUser = users.some((u) => u.userId === userId)
      ? userId
      : users[0]?.userId;
    if (!selectedUser) throw new Error("No demo users exist in the database.");
    const [saved, trips, itineraries] = await Promise.all([
      readAll(`/users/${selectedUser}/saved-pois`),
      readAll(`/users/${selectedUser}/trips`),
      readAll(`/users/${selectedUser}/itineraries`),
    ]);
    const catalog = lists
      .flat()
      .map((p) => ({
        ...p,
        cityName:
          cities.find((c) => c.cityId === p.cityId)?.cityName || p.cityName,
      }));
    const detailedItineraries = await Promise.all(
      itineraries.map((i) =>
        request(`/users/${selectedUser}/itineraries/${i.itineraryNo}`),
      ),
    );
    return {
      cities,
      users,
      catalog,
      userId: selectedUser,
      saved: saved.map((p) => p.poiId),
      trips,
      itineraries: detailedItineraries.map((i) => ({
        ...i,
        pois: i.pois.map((p) => catalog.find((c) => c.poiId === p.poiId) || p),
      })),
    };
  },
  async listPois(resource, filters = {}) {
    // General POI lists omit subtype data; bootstrap supplies their type.
    return (await readAll(`/${resource}`, filters)).map((p) =>
      resource === "pois" ? p : normalize(p, resource),
    );
  },
  async getPoi(id) {
    return normalize(await request(`/pois/${id}`));
  },
  getReviews: (id) => readAll(`/pois/${id}/reviews`),
  savePoi: (userId, poiId, save) =>
    request(`/users/${userId}/saved-pois/${poiId}`, save ? "POST" : "DELETE"),
  writePlan: (kind, userId, number, form) =>
    request(
      `/users/${userId}/${kind}${number ? `/${number}` : ""}`,
      number ? "PUT" : "POST",
      planBody(form, kind),
    ),
  deletePlan: (kind, userId, number) =>
    request(`/users/${userId}/${kind}/${number}`, "DELETE"),
  itineraryPoi: (userId, number, poiId, add) =>
    request(
      `/users/${userId}/itineraries/${number}/pois/${poiId}`,
      add ? "POST" : "DELETE",
    ),
  writeReview: (userId, poiId, reviewId, body) =>
    request(
      reviewId ? `/reviews/${reviewId}` : `/pois/${poiId}/reviews`,
      reviewId ? "PUT" : "POST",
      {
        rating: Number(body.rating),
        comments: body.comments?.trim() || null,
        ...(!reviewId ? { userId } : {}),
      },
    ),
  deleteReview: (reviewId) => request(`/reviews/${reviewId}`, "DELETE"),
};
let storage;
try {
  storage = window.localStorage;
} catch {
  /* The UI still works for this session. */
}
export const api = USE_MOCK_DATA ? createMockRepository(storage) : live;
