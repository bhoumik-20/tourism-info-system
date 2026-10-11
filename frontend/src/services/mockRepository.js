import { cities, users, pois, initialState } from "../data/mockData.js";
import { filterPois, planBody } from "./catalog.js";

export const STORAGE_KEY = "voyage-tis-demo-v1";
export function createMockRepository(storage) {
  let state = structuredClone(initialState);
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
    if (
      saved?.version === 1 &&
      ["saved", "trips", "itineraries", "reviews"].every((key) =>
        Array.isArray(saved[key]),
      )
    )
      state = saved;
  } catch {
    /* Missing or corrupt storage starts a fresh demo. */
  }
  state.users ||= structuredClone(users);
  const mutate = (fn) => {
    const next = structuredClone(state);
    const value = fn(next);
    storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    state = next;
    return structuredClone(value);
  };
  const requireItem = (items, check) => {
    const item = items.find(check);
    if (!item) throw new Error("This item could not be found.");
    return item;
  };
  const catalog = () =>
    pois.map((p) => {
      const reviews = state.reviews.filter((r) => r.poiId === p.poiId);
      return {
        ...p,
        reviewCount: reviews.length,
        averageRating: reviews.length
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null,
      };
    });
  const plans = (kind, userId) =>
    state[kind].filter((p) => p.userId === userId);
  const withPois = (itinerary) => ({
    ...itinerary,
    pois: catalog()
      .filter((p) => itinerary.poiIds.includes(p.poiId))
      .sort((a, b) => a.name.localeCompare(b.name)),
  });
  return {
    async bootstrap(userId) {
      return structuredClone({
        cities,
        users: state.users,
        catalog: catalog(),
        saved: state.saved
          .filter((p) => p.userId === userId)
          .map((p) => p.poiId),
        trips: plans("trips", userId),
        itineraries: plans("itineraries", userId).map(withPois),
      });
    },

    async getProfile(userId) {
      const user = requireItem(state.users, u => u.userId === userId);
      return structuredClone({ ...user,
        reviewCount: state.reviews.filter(r => r.userId === userId).length,
        savedPoiCount: state.saved.filter(s => s.userId === userId).length,
        tripCount: plans('trips', userId).length,
        itineraryCount: plans('itineraries', userId).length,
      });
    },
    async createProfile(body) {
      return mutate(next => {
        if (next.users.some(u => u.email === body.email)) throw new Error('This email address is already in use.');
        const user = { ...body, userId: Math.max(0, ...next.users.map(u => u.userId)) + 1 };
        next.users.push(user); return user;
      });
    },
    async updateProfile(userId, body) {
      return mutate(next => {
        if (next.users.some(u => u.userId !== userId && u.email === body.email)) throw new Error('This email address is already in use.');
        const user = requireItem(next.users, u => u.userId === userId);
        Object.assign(user, body); return user;
      });
    },
    async listPois(resource = "pois", filters = {}) {
      return filterPois(catalog(), {
        ...filters,
        ...(resource !== "pois" ? { type: resource } : {}),
      });
    },
    async getPoi(poiId) {
      return structuredClone(
        requireItem(catalog(), (p) => p.poiId === Number(poiId)),
      );
    },
    async getReviews(poiId) {
      return state.reviews
        .filter((r) => r.poiId === Number(poiId))
        .map((r) => ({ ...r, ...state.users.find((u) => u.userId === r.userId) }))
        .sort((a, b) => b.reviewId - a.reviewId);
    },
    async savePoi(userId, poiId, save) {
      return mutate((next) => {
        requireItem(state.users, (u) => u.userId === userId);
        requireItem(pois, (p) => p.poiId === poiId);
        const check = (p) => p.userId === userId && p.poiId === poiId;
        if (save && next.saved.some(check))
          throw new Error("This place is already saved.");
        if (save) next.saved.push({ userId, poiId });
        else next.saved = next.saved.filter((p) => !check(p));
        return null;
      });
    },
    async writePlan(kind, userId, number, form) {
      const body = planBody(form, kind);
      return mutate((next) => {
        requireItem(state.users, (u) => u.userId === userId);
        if (kind === "itineraries")
          requireItem(
            next.trips,
            (t) => t.userId === userId && t.tripNo === body.tripNo,
          );
        const key = kind === "trips" ? "tripNo" : "itineraryNo";
        if (number) {
          const item = requireItem(
            next[kind],
            (p) => p.userId === userId && p[key] === number,
          );
          Object.assign(item, body);
          return item;
        }
        const item = {
          ...body,
          userId,
          [key]:
            Math.max(
              0,
              ...next[kind]
                .filter((p) => p.userId === userId)
                .map((p) => p[key]),
            ) + 1,
          ...(kind === "itineraries" ? { poiIds: [] } : {}),
        };
        next[kind].push(item);
        return item;
      });
    },
    async deletePlan(kind, userId, number) {
      return mutate((next) => {
        const key = kind === "trips" ? "tripNo" : "itineraryNo";
        requireItem(
          next[kind],
          (p) => p.userId === userId && p[key] === number,
        );
        if (
          kind === "trips" &&
          next.itineraries.some(
            (i) => i.userId === userId && i.tripNo === number,
          )
        )
          throw new Error(
            "Remove this trip’s itineraries before deleting the trip.",
          );
        next[kind] = next[kind].filter(
          (p) => p.userId !== userId || p[key] !== number,
        );
        return null;
      });
    },
    async itineraryPoi(userId, number, poiId, add) {
      return mutate((next) => {
        const item = requireItem(
          next.itineraries,
          (i) => i.userId === userId && i.itineraryNo === number,
        );
        requireItem(pois, (p) => p.poiId === poiId);
        if (add && item.poiIds.includes(poiId))
          throw new Error("This POI is already in the itinerary.");
        if (add) item.poiIds.push(poiId);
        else item.poiIds = item.poiIds.filter((id) => id !== poiId);
        return item;
      });
    },
    async writeReview(userId, poiId, reviewId, body) {
      const rating = Number(body.rating),
        comments = body.comments?.trim() || null;
      if (
        !Number.isFinite(rating) ||
        rating < 1 ||
        rating > 5 ||
        Math.abs(rating * 10 - Math.round(rating * 10)) > 1e-8
      )
        throw new Error(
          "Choose a rating from 1 to 5, with at most one decimal place.",
        );
      if (new TextEncoder().encode(comments || "").length > 1000)
        throw new Error("The review is too long.");
      return mutate((next) => {
        requireItem(state.users, (u) => u.userId === userId);
        requireItem(pois, (p) => p.poiId === poiId);
        if (reviewId) {
          const item = requireItem(
            next.reviews,
            (r) => r.reviewId === reviewId && r.userId === userId,
          );
          Object.assign(item, {
            rating,
            comments,
            lastUpdated: new Date().toISOString(),
          });
          return item;
        }
        const item = {
          reviewId: Math.max(0, ...next.reviews.map((r) => r.reviewId)) + 1,
          poiId,
          userId,
          rating,
          comments,
          reviewDate: new Date().toISOString(),
        };
        next.reviews.push(item);
        return item;
      });
    },
    async deleteReview(reviewId, userId) {
      return mutate((next) => {
        requireItem(
          next.reviews,
          (r) => r.reviewId === reviewId && r.userId === userId,
        );
        next.reviews = next.reviews.filter((r) => r.reviewId !== reviewId);
        return null;
      });
    },
  };
}
