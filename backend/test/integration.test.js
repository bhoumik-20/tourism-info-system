'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const db = require('../src/config/database');
const v = require('../src/validation');
const app = require('../src/app');
let server, base, fixture, original;
const created = { reviews: new Set(), trips: new Set(), itineraries: new Set(), saved: new Set() };

async function request(method, path, body, expected = 200) {
  const response = await fetch(base + path, {
    method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal(response.status, expected, `${method} ${path}: expected ${expected}, received ${response.status}`);
  if (expected === 204) return null;
  return response.json();
}
async function snapshot() {
  return db.read(async c => {
    const tables = await v.rows(c, 'SELECT Table_Name FROM USER_TABLES ORDER BY Table_Name');
    const counts = {};
    for (const { tableName } of tables) {
      assert.match(tableName, /^[A-Z_]+$/);
      counts[tableName] = (await v.one(c, `SELECT COUNT(*) AS N FROM ${tableName}`)).n;
    }
    const hashes = {};
    for (const table of ['REVIEW', 'TRIP', 'ITINERARY', 'ITINERARY_POI', 'USER_SAVES_POI']) {
      const rows = await v.rows(c, `SELECT * FROM ${table}`);
      const serialized = rows.map(row => JSON.stringify(row)).sort();
      hashes[table] = createHash('sha256').update(JSON.stringify(serialized)).digest('hex');
    }
    return { counts, hashes };
  });
}
before(async () => {
  if (process.env.VOYAGE_LIVE_TESTS_APPROVED !== '1') throw new Error('Live write tests require user approval of TEST_PLAN_PHASE2.md.');
  await db.initialize();
  original = await snapshot();
  fixture = await db.read(async c => {
    const user = await v.one(c, 'SELECT MIN(User_ID) AS ID FROM APP_USER');
    const city = await v.one(c, 'SELECT MIN(City_ID) AS ID FROM CITY');
    const poi = await v.one(c, 'SELECT MIN(POI_ID) AS ID FROM POI');
    assert.ok(user.id && city.id && poi.id, 'The populated demonstration data is required.');
    return { userId: user.id, cityId: city.id, poiId: poi.id };
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  try {
    if (fixture) await db.write(async c => {
      // Remove only records created by this run, including after a failed assertion.
      for (const reviewId of created.reviews) await c.execute('DELETE FROM REVIEW WHERE Review_ID = :reviewId', { reviewId });
      for (const itemNo of created.itineraries) {
        await c.execute('DELETE FROM ITINERARY_POI WHERE User_ID = :userId AND Itinerary_No = :itemNo', { userId: fixture.userId, itemNo });
        await c.execute('DELETE FROM ITINERARY WHERE User_ID = :userId AND Itinerary_No = :itemNo', { userId: fixture.userId, itemNo });
      }
      for (const itemNo of created.trips) await c.execute('DELETE FROM TRIP WHERE User_ID = :userId AND Trip_No = :itemNo', { userId: fixture.userId, itemNo });
      for (const poiId of created.saved) await c.execute('DELETE FROM USER_SAVES_POI WHERE User_ID = :userId AND POI_ID = :poiId', { userId: fixture.userId, poiId });
    });
    if (original) assert.deepEqual(await snapshot(), original, 'Existing rows must be unchanged after tests.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await db.close();
  }
});

test('health, cities, demo users, catalogue lists/details, multivalued data, filters, and pagination', async () => {
  assert.equal((await request('GET', '/health')).database, 'connected');
  const cities = await request('GET', '/cities');
  assert.equal(cities.data.length, 2);
  assert.equal((await request('GET', `/cities/${fixture.cityId}`)).data.cityId, fixture.cityId);
  const users = await request('GET', '/users');
  assert.ok(users.data.some(u => u.userId === fixture.userId));
  assert.equal(users.data[0].email, undefined);
  for (const resource of ['pois', 'places', 'restaurants', 'activities', 'events']) {
    const list = await request('GET', `/${resource}?limit=100`);
    assert.ok(list.data.length, `${resource} must contain populated rows`);
    const row = list.data[0];
    const details = (await request('GET', `/${resource}/${row.poiId}`)).data;
    assert.ok(Array.isArray(details.contacts));
    assert.ok(Array.isArray(details.nearby));
    if (resource === 'places') assert.ok(Array.isArray(details.categories));
    if (resource === 'restaurants') {
      for (const key of ['cuisines', 'famousDishes', 'diningTypes', 'ambience', 'parkingTypes', 'accessibility', 'paymentMethods']) assert.ok(Array.isArray(details[key]));
      if (details.cuisines.length) {
        const filtered = await request('GET', `/restaurants?cuisine=${encodeURIComponent(details.cuisines[0])}&limit=100`);
        assert.ok(filtered.data.some(item => item.poiId === row.poiId));
      }
      if (row.priceRange) assert.ok((await request('GET', `/restaurants?priceRange=${encodeURIComponent(row.priceRange)}&limit=100`)).data.every(item => item.priceRange === row.priceRange));
      for (const [param, column] of [['delivery', 'deliveryAvailable'], ['parking', 'parkingAvailable']]) {
        if (row[column]) assert.ok((await request('GET', `/restaurants?${param}=${row[column]}&limit=100`)).data.every(item => item[column] === row[column]));
      }
    }
    if (resource === 'activities') {
      assert.ok(Array.isArray(details.seasons)); assert.ok(Array.isArray(details.equipment)); assert.ok(Array.isArray(details.locations));
      if (details.seasons.length) assert.ok((await request('GET', `/activities?season=${encodeURIComponent(details.seasons[0])}&limit=100`)).data.some(item => item.poiId === row.poiId));
      if (row.activityType) assert.ok((await request('GET', `/activities?activityType=${encodeURIComponent(row.activityType)}&limit=100`)).data.every(item => item.activityType === row.activityType));
      if (row.difficultyLevel) assert.ok((await request('GET', `/activities?difficulty=${encodeURIComponent(row.difficultyLevel)}&limit=100`)).data.every(item => item.difficultyLevel === row.difficultyLevel));
      if (row.cost !== null) assert.ok((await request('GET', `/activities?maxCost=${row.cost}&limit=100`)).data.every(item => item.cost <= row.cost));
    }
    if (resource === 'places' && details.categories.length) assert.ok((await request('GET', `/places?category=${encodeURIComponent(details.categories[0])}&limit=100`)).data.some(item => item.poiId === row.poiId));
    if (resource === 'events') {
      if (row.eventType) assert.ok((await request('GET', `/events?eventType=${encodeURIComponent(row.eventType)}&limit=100`)).data.every(item => item.eventType === row.eventType));
      if (row.startDate && row.endDate) assert.ok((await request('GET', `/events?from=${row.startDate}&to=${row.endDate}&limit=100`)).data.some(item => item.poiId === row.poiId));
    }
    const search = await request('GET', `/${resource}?search=${encodeURIComponent(row.name)}&limit=100`);
    assert.ok(search.data.some(item => item.poiId === row.poiId));
    const filtered = await request('GET', `/${resource}?city=${fixture.cityId}&limit=100`);
    assert.ok(filtered.data.every(item => item.cityId === fixture.cityId));
    if (resource !== 'pois') assert.equal((await request('GET', `/pois?type=${resource}&limit=100`)).data.length, list.data.length);
    await request('GET', `/${resource}/99999999`, undefined, 404);
  }
  const first = await request('GET', '/pois?page=1&limit=1');
  const second = await request('GET', '/pois?page=2&limit=1');
  assert.notEqual(first.data[0].poiId, second.data[0].poiId);
  assert.equal((await request('GET', '/pois?page=999999&limit=1')).data.length, 0);
  assert.equal((await request('GET', "/pois?search=' OR 1=1 --")).data.length, 0);
  assert.equal((await request('GET', '/pois?search=%25')).data.length, 0);
  assert.ok((await request('GET', '/pois?minRating=4&limit=100')).data.every(item => item.averageRating >= 4));
});

test('reviews insert/update/delete are committed and ratings are derived from live SQL', async () => {
  const result = await request('POST', `/pois/${fixture.poiId}/reviews`, { userId: fixture.userId, rating: 4.5, comments: 'Backend integration test' }, 201);
  const id = result.data.reviewId; created.reviews.add(id);
  let list = await request('GET', `/pois/${fixture.poiId}/reviews?limit=100`);
  assert.ok(list.data.some(row => row.reviewId === id && row.rating === 4.5));
  const changed = await request('PUT', `/reviews/${id}?userId=${fixture.userId}`, { userId: fixture.userId, rating: 3, comments: 'Updated test review' });
  assert.equal(changed.data.rating, 3); assert.ok(changed.data.lastUpdated);
  const rating = await db.read(c => v.one(c, 'SELECT ROUND(AVG(Rating), 2) AS Average_Rating, COUNT(*) AS Review_Count FROM REVIEW WHERE POI_ID = :poiId', { poiId: fixture.poiId }));
  const detail = (await request('GET', `/pois/${fixture.poiId}`)).data;
  assert.equal(detail.averageRating, rating.averageRating); assert.equal(detail.reviewCount, rating.reviewCount);
  await request('DELETE', `/reviews/${id}?userId=${fixture.userId}`, undefined, 204); created.reviews.delete(id);
  await request('PUT', `/reviews/${id}?userId=${fixture.userId}`, { userId: fixture.userId, rating: 2 }, 404);
  await request('DELETE', `/reviews/${id}?userId=${fixture.userId}`, undefined, 404);
});

test('saved POIs preserve existing associations and reject duplicates', async () => {
  const saved = await request('GET', `/users/${fixture.userId}/saved-pois?limit=100`);
  const unsaved = await db.read(c => v.rows(c, `SELECT p.POI_ID FROM POI p WHERE NOT EXISTS
    (SELECT 1 FROM USER_SAVES_POI s WHERE s.User_ID = :userId AND s.POI_ID = p.POI_ID) ORDER BY p.POI_ID`, { userId: fixture.userId }));
  assert.ok(unsaved.length, 'Need an unsaved populated POI for this test.');
  const poiId = unsaved[0].poiId, path = `/users/${fixture.userId}/saved-pois/${poiId}`;
  await request('POST', path, undefined, 201); created.saved.add(poiId);
  await request('POST', path, undefined, 409);
  assert.ok((await request('GET', `/users/${fixture.userId}/saved-pois?limit=100`)).data.some(row => row.poiId === poiId));
  await request('DELETE', path, undefined, 204); created.saved.delete(poiId);
  await request('DELETE', path, undefined, 404);
  assert.deepEqual((await request('GET', `/users/${fixture.userId}/saved-pois?limit=100`)).data, saved.data);
});

test('trip and itinerary lifecycle, composite keys, POI membership, and dependent-record conflicts', async () => {
  const prefix = `/users/${fixture.userId}`;
  await request('GET', `${prefix}/trips`); await request('GET', `${prefix}/itineraries`);
  const trip = (await request('POST', `${prefix}/trips`, { tripName: 'Backend test trip', startDate: '2026-10-20', endDate: '2026-10-22', status: 'Planned' }, 201)).data;
  created.trips.add(trip.tripNo);
  const tripPath = `${prefix}/trips/${trip.tripNo}`;
  assert.equal((await request('GET', tripPath)).data.startDate, '2026-10-20');
  assert.equal((await request('PUT', tripPath, { tripName: 'Updated backend test trip', status: 'Ongoing', startDate: '2026-10-20', endDate: '2026-10-22' })).data.status, 'Ongoing');
  const itinerary = (await request('POST', `${prefix}/itineraries`, { itineraryName: 'Backend test day', tripNo: trip.tripNo, startDate: '2026-10-21', endDate: '2026-10-21' }, 201)).data;
  created.itineraries.add(itinerary.itineraryNo);
  const itineraryPath = `${prefix}/itineraries/${itinerary.itineraryNo}`;
  assert.equal((await request('GET', itineraryPath)).data.tripNo, trip.tripNo);
  assert.ok((await request('GET', `${prefix}/itineraries?tripNo=${trip.tripNo}`)).data.some(row => row.itineraryNo === itinerary.itineraryNo));
  await request('PUT', itineraryPath, { itineraryName: 'Updated backend test day', tripNo: trip.tripNo, startDate: '2026-10-21', endDate: '2026-10-21' });
  const member = `${itineraryPath}/pois/${fixture.poiId}`;
  await request('POST', member, undefined, 201); await request('POST', member, undefined, 409);
  assert.ok((await request('GET', itineraryPath)).data.pois.some(row => row.poiId === fixture.poiId));
  await request('DELETE', tripPath, undefined, 409);
  assert.equal((await request('GET', tripPath)).data.tripNo, trip.tripNo);
  await request('DELETE', member, undefined, 204); await request('DELETE', member, undefined, 404);
  await request('POST', member, undefined, 201);
  await request('DELETE', itineraryPath, undefined, 204); created.itineraries.delete(itinerary.itineraryNo);
  const remaining = await db.read(c => v.one(c, 'SELECT COUNT(*) AS N FROM ITINERARY_POI WHERE User_ID = :userId AND Itinerary_No = :itemNo', { userId: fixture.userId, itemNo: itinerary.itineraryNo }));
  assert.equal(remaining.n, 0);
  await request('GET', itineraryPath, undefined, 404);
  await request('DELETE', tripPath, undefined, 204); created.trips.delete(trip.tripNo);
  await request('GET', tripPath, undefined, 404);
});

test('invalid inputs and missing references produce safe errors without creating rows', async () => {
  const prefix = `/users/${fixture.userId}`;
  for (const url of ['/pois?city=abc', '/pois?limit=101', '/pois?page=0', '/pois?type=unknown', '/pois?unknown=1', '/pois?city=1&city=2', '/restaurants?delivery=true', '/events?from=2026-02-30', '/events?from=2026-10-22&to=2026-10-20', '/cities/0']) await request('GET', url, undefined, 400);
  await request('GET', '/cities/999999', undefined, 404);
  await request('GET', '/unknown', undefined, 404);
  await request('GET', '/users/99999999/trips', undefined, 404);
  await request('POST', `/pois/${fixture.poiId}/reviews`, { userId: fixture.userId, rating: 6 }, 400);
  await request('POST', `/pois/${fixture.poiId}/reviews`, { userId: fixture.userId, rating: 4.55 }, 400);
  await request('POST', `/pois/${fixture.poiId}/reviews`, { userId: 99999999, rating: 4 }, 404);
  await request('POST', '/pois/99999999/reviews', { userId: fixture.userId, rating: 4 }, 404);
  await request('POST', `${prefix}/trips`, {}, 400);
  await request('POST', `${prefix}/trips`, { tripName: 'Invalid', startDate: '2026-10-22', endDate: '2026-10-20' }, 400);
  await request('POST', `${prefix}/trips`, { tripName: 'Invalid', surprise: true }, 400);
  await request('POST', `${prefix}/itineraries`, { itineraryName: 'Invalid', tripNo: 999999 }, 404);
  await request('POST', `${prefix}/saved-pois/99999999`, undefined, 404);
  await request('POST', `${prefix}/itineraries/999999/pois/${fixture.poiId}`, undefined, 404);
  const malformed = await fetch(base + `/pois/${fixture.poiId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(malformed.status, 400);
});

test('failed multi-statement writes roll back and concurrent weak-entity inserts use distinct numbers', async () => {
  const initial = await snapshot();
  const unsaved = await db.read(c => v.rows(c, `SELECT p.POI_ID FROM POI p WHERE NOT EXISTS
    (SELECT 1 FROM USER_SAVES_POI s WHERE s.User_ID = :userId AND s.POI_ID = p.POI_ID) ORDER BY p.POI_ID`, { userId: fixture.userId }));
  const sentinel = new Error('Deliberate transaction rollback');
  await assert.rejects(db.write(async c => {
    await c.execute('INSERT INTO USER_SAVES_POI (User_ID, POI_ID) VALUES (:userId, :poiId)', { userId: fixture.userId, poiId: unsaved[0].poiId });
    throw sentinel;
  }), error => error === sentinel);
  assert.deepEqual(await snapshot(), initial);
  const results = await Promise.allSettled([1, 2].map(async n => {
    const row = (await request('POST', `/users/${fixture.userId}/trips`, { tripName: `Concurrent backend test ${n}` }, 201)).data;
    created.trips.add(row.tripNo); return row;
  }));
  for (const result of results) assert.equal(result.status, 'fulfilled');
  assert.notEqual(results[0].value.tripNo, results[1].value.tripNo);
  for (const result of results) {
    await request('DELETE', `/users/${fixture.userId}/trips/${result.value.tripNo}`, undefined, 204);
    created.trips.delete(result.value.tripNo);
  }
});
