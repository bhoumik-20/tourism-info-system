import test from "node:test";
import assert from "node:assert/strict";
import { filterValues } from "../src/services/catalog.js";

test("filter choices reflect database scalar and collection values", () => {
  const records = [
    {
      type: "restaurants",
      priceRange: "Moderate",
      cuisines: ["Parsi", "Indian"],
    },
    { type: "restaurants", priceRange: "Budget", cuisines: ["Indian"] },
    { type: "restaurants", priceRange: null, cuisines: [] },
    { type: "events", eventType: "Food Festival", priceRange: "Other" },
  ];
  assert.deepEqual(filterValues(records, "priceRange", "restaurants"), [
    "Budget",
    "Moderate",
  ]);
  assert.deepEqual(filterValues(records, "cuisines", "restaurants"), [
    "Indian",
    "Parsi",
  ]);
  assert.deepEqual(filterValues(records, "eventType", "events"), [
    "Food Festival",
  ]);
  assert.deepEqual(filterValues(records, "seasons", "activities"), []);
});
