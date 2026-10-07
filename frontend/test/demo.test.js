import test from "node:test";
import assert from "node:assert/strict";
import { createMockRepository } from "../src/services/mockRepository.js";
import { filterPois, planBody } from "../src/services/catalog.js";

const trip = {
  tripName: "Test trip",
  startDate: "2026-11-01",
  endDate: "2026-11-03",
  description: "Test",
  status: "Planned",
};

test("search is literal, case-insensitive and combines city and subtype filters", async () => {
  const repo = createMockRepository();
  const found = await repo.listPois("pois", {
    search: "PALACE",
    city: "1",
    type: "places",
  });
  assert.equal(found.length, 2);
  assert.equal(
    (await repo.listPois("pois", { search: "%", city: "1" })).length,
    0,
  );
  assert.equal(
    (await repo.listPois("pois", { search: "palace", city: "2" })).length,
    0,
  );
});
test("rating filters exclude unreviewed records and ratings track review CRUD", async () => {
  const repo = createMockRepository();
  assert.equal((await repo.getPoi(2)).averageRating, null);
  assert.ok(
    !(await repo.listPois("pois", { minRating: 4 })).some((p) => p.poiId === 2),
  );
  const r = await repo.writeReview(1, 2, null, {
    rating: 4.2,
    comments: "Good",
  });
  assert.equal((await repo.getPoi(2)).averageRating, 4.2);
  await repo.writeReview(1, 2, r.reviewId, { rating: 3, comments: "Updated" });
  assert.equal((await repo.getPoi(2)).averageRating, 3);
  await repo.deleteReview(r.reviewId, 1);
  assert.equal((await repo.getPoi(2)).averageRating, null);
  assert.equal((await repo.getPoi(2)).reviewCount, 0);
});
test("subtype filters match the existing API semantics", async () => {
  const repo = createMockRepository();
  assert.equal(
    (
      await repo.listPois("restaurants", {
        cuisine: "south indian",
        priceRange: "Budget",
      })
    ).length,
    2,
  );
  assert.equal(
    (await repo.listPois("activities", { difficulty: "Easy", maxCost: 500 }))
      .length,
    1,
  );
  assert.equal(
    (await repo.listPois("events", { from: "2026-11-15", to: "2026-11-15" }))
      .length,
    1,
  );
  assert.equal(
    filterPois([{ name: "Unpriced", type: "activities", cost: null }], {
      maxCost: 500,
    }).length,
    0,
  );
});
test("saved POIs are isolated per user and survive a reload", async () => {
  let persisted;
  const storage = {
    getItem: () => persisted || null,
    setItem: (_, value) => {
      persisted = value;
    },
  };
  const repo = createMockRepository(storage);
  await repo.savePoi(2, 3, true);
  assert.ok((await repo.bootstrap(2)).saved.includes(3));
  assert.ok(!(await repo.bootstrap(1)).saved.includes(3));
  await assert.rejects(repo.savePoi(2, 3, true));
  assert.ok(
    (await createMockRepository(storage).bootstrap(2)).saved.includes(3),
  );
  await repo.savePoi(2, 3, false);
  assert.ok(!(await repo.bootstrap(2)).saved.includes(3));
});
test("trip numbers belong to their user and trip update preserves ownership", async () => {
  const repo = createMockRepository();
  const t = await repo.writePlan("trips", 2, null, trip);
  assert.equal(t.tripNo, 1);
  assert.equal(t.userId, 2);
  const updated = await repo.writePlan("trips", 2, t.tripNo, {
    ...trip,
    tripName: "Updated",
  });
  assert.equal(updated.tripName, "Updated");
  assert.equal(
    (await repo.bootstrap(1)).trips[0].tripName,
    "A weekend in Mumbai",
  );
  await repo.deletePlan("trips", 2, t.tripNo);
  assert.equal((await repo.bootstrap(2)).trips.length, 0);
});
test("itinerary membership respects user/trip composite keys and delete conflicts", async () => {
  const repo = createMockRepository();
  await assert.rejects(
    repo.writePlan("itineraries", 2, null, {
      itineraryName: "Wrong owner",
      tripNo: 1,
    }),
  );
  await assert.rejects(repo.deletePlan("trips", 1, 1), /itineraries/);
  const i = await repo.writePlan("itineraries", 1, null, {
    itineraryName: "Test itinerary",
    tripNo: 1,
  });
  await repo.itineraryPoi(1, i.itineraryNo, 3, true);
  await repo.itineraryPoi(1, i.itineraryNo, 1, true);
  const current = (await repo.bootstrap(1)).itineraries.find(
    (x) => x.itineraryNo === i.itineraryNo,
  );
  assert.deepEqual(
    current.pois.map((p) => p.name),
    ["Bangalore Palace", "Lalbagh Botanical Garden"],
  );
  await assert.rejects(repo.itineraryPoi(1, i.itineraryNo, 3, true));
  await assert.rejects(repo.itineraryPoi(2, i.itineraryNo, 3, false));
  await repo.itineraryPoi(1, i.itineraryNo, 3, false);
  await repo.deletePlan("itineraries", 1, i.itineraryNo);
  assert.ok(
    !(await repo.bootstrap(1)).itineraries.some(
      (x) => x.itineraryNo === i.itineraryNo,
    ),
  );
});
test("reviews reject invalid ratings and prevent editing another demo user’s review", async () => {
  const repo = createMockRepository();
  await assert.rejects(repo.writeReview(1, 1, null, { rating: 6 }));
  await assert.rejects(repo.writeReview(1, 1, null, { rating: 4.25 }));
  await assert.rejects(repo.writeReview(1, 1, 1, { rating: 3 }));
  await assert.rejects(repo.deleteReview(1, 1));
});
test("plans validate real dates, chronological ranges, UTF-8 length and optional nulls", () => {
  assert.throws(() => planBody({ ...trip, endDate: "2026-10-01" }, "trips"));
  assert.throws(() => planBody({ ...trip, startDate: "2026-02-30" }, "trips"));
  assert.throws(() => planBody({ ...trip, startDate: "0000-01-01" }, "trips"));
  assert.throws(() =>
    planBody({ ...trip, tripName: "界".repeat(51) }, "trips"),
  );
  const body = planBody({ tripName: " A new trip " }, "trips");
  assert.equal(body.tripName, "A new trip");
  assert.equal(body.startDate, null);
});
test("storage failures leave the in-memory demo unchanged", async () => {
  const repo = createMockRepository({
    getItem: () => null,
    setItem: () => {
      throw new Error("Storage full");
    },
  });
  await assert.rejects(repo.savePoi(1, 3, true), /Storage full/);
  assert.ok(!(await repo.bootstrap(1)).saved.includes(3));
});
