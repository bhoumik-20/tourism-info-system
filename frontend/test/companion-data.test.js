import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_CITIES,
  DEMO_POIS,
  createInitialState,
} from "../src/companion/demoData.js";

const ids = (items, key) => new Set(items.map((item) => item[key]));

test("every demonstration POI belongs to exactly one valid city and subtype records have a POI supertype", () => {
  const cityIds = ids(DEMO_CITIES, "cityId");
  const poiIds = ids(DEMO_POIS, "poiId");
  assert.equal(poiIds.size, DEMO_POIS.length, "POI_ID values must be unique");
  for (const poi of DEMO_POIS) {
    assert.ok(cityIds.has(poi.cityId), `${poi.name} must reference a known city`);
    assert.ok(["place", "restaurant", "activity", "event"].includes(poi.type));
    assert.ok(!Object.hasOwn(poi, "averageRating"), "Average_Rating is derived, not stored on POI records");
    assert.ok(Array.isArray(poi.contactNumbers));
    assert.equal(poi.address.city, DEMO_CITIES.find((city) => city.cityId === poi.cityId).cityName);
  }
  for (const type of ["place", "restaurant", "activity", "event"]) {
    assert.ok(DEMO_POIS.some((poi) => poi.type === type), `sample includes ${type} subtype`);
  }
});

test("saved POIs and reviews connect valid users to valid POIs without duplicate saves", () => {
  const state = createInitialState();
  const userIds = ids(state.users, "userId");
  const poiIds = ids(state.pois, "poiId");
  const saveKeys = state.saved.map((entry) => `${entry.userId}:${entry.poiId}`);
  assert.equal(new Set(saveKeys).size, saveKeys.length);
  for (const entry of state.saved) {
    assert.ok(userIds.has(entry.userId));
    assert.ok(poiIds.has(entry.poiId));
  }
  for (const review of state.reviews) {
    assert.ok(userIds.has(review.userId));
    assert.ok(poiIds.has(review.poiId));
    assert.ok(review.rating >= 1 && review.rating <= 5);
    assert.ok(review.reviewDate);
    assert.ok(review.lastUpdated);
  }
});

test("trip and itinerary partial keys are owner-scoped and every itinerary has a valid parent trip", () => {
  const state = createInitialState();
  const userIds = ids(state.users, "userId");
  const tripKeys = new Set();
  for (const trip of state.trips) {
    assert.ok(userIds.has(trip.userId));
    const key = `${trip.userId}:${trip.tripNo}`;
    assert.ok(!tripKeys.has(key), `duplicate owner-scoped trip key ${key}`);
    tripKeys.add(key);
  }
  const itineraryKeys = new Set();
  for (const itinerary of state.itineraries) {
    assert.ok(userIds.has(itinerary.userId));
    assert.ok(tripKeys.has(`${itinerary.userId}:${itinerary.tripNo}`));
    const key = `${itinerary.userId}:${itinerary.itineraryNo}`;
    assert.ok(!itineraryKeys.has(key), `duplicate owner-scoped itinerary key ${key}`);
    itineraryKeys.add(key);
    assert.equal(new Set(itinerary.poiIds).size, itinerary.poiIds.length, "an itinerary has no duplicate POI memberships");
    for (const poiId of itinerary.poiIds) assert.ok(state.pois.some((poi) => poi.poiId === poiId));
  }
});

test("nearby, restaurant-hosted event, and activity-location relations preserve their endpoint types", () => {
  const state = createInitialState();
  const poiById = new Map(state.pois.map((poi) => [poi.poiId, poi]));
  for (const relation of state.nearbyRelations) {
    assert.ok(poiById.has(relation.poiId) && poiById.has(relation.nearbyPoiId));
    assert.notEqual(relation.poiId, relation.nearbyPoiId);
  }
  for (const relation of state.restaurantEventRelations) {
    assert.equal(poiById.get(relation.restaurantPoiId)?.type, "restaurant");
    assert.equal(poiById.get(relation.eventPoiId)?.type, "event");
  }
  for (const relation of state.activityLocationRelations) {
    assert.equal(poiById.get(relation.activityPoiId)?.type, "activity");
    assert.ok(poiById.has(relation.poiId));
  }
  assert.ok(state.nearbyRelations.length > 1, "fixture demonstrates multiple nearby links");
  assert.ok(state.restaurantEventRelations.length > 0, "fixture demonstrates optional hosting links");
  assert.ok(state.activityLocationRelations.length > 1, "fixture demonstrates multiple activity locations");
});
