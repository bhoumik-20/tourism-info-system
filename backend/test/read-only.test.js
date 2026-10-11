'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/database');
const v = require('../src/validation');
const app = require('../src/app');
let server, base;
before(async()=>{await db.initialize();server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/api`;});
after(async()=>{if(server)await new Promise(r=>server.close(r));await db.close();});
async function get(path,status=200){const response=await fetch(base+path);assert.equal(response.status,status,path);return response.json();}
test('profile attributes and all four counts match independent base-table SELECTs',async()=>{
  const users=(await get('/users')).data;assert.ok(users.length);
  for(const user of users){
    const p=(await get(`/users/${user.userId}`)).data;assert.equal(p.userId,user.userId);assert.ok(p.email);
    await db.read(async c=>{for(const [key,table] of [['reviewCount','REVIEW'],['savedPoiCount','USER_SAVES_POI'],['tripCount','TRIP'],['itineraryCount','ITINERARY']]){
      assert.equal(p[key],(await v.one(c,`SELECT COUNT(*) AS N FROM ${table} WHERE User_ID=:userId`,{userId:user.userId})).n);
    }});
  }
  await get('/users/99999999',404);
});
test('all six collection endpoints match their installed views and preserve original IDs',async()=>{
  const collections=(await get('/collections')).data;assert.equal(collections.length,6);
  const names={'top-rated':'VW_TOP_RATED_POIS',popular:'VW_POPULAR_POIS',budget:'VW_BUDGET_EXPERIENCES',foodie:'VW_FOODIE_FAVORITES',upcoming:'VW_UPCOMING_EVENTS','hidden-gems':'VW_HIDDEN_GEMS'};
  for(const item of collections){
    const records=(await get(`/collections/${item.slug}?limit=100`)).data;
    const expected=await db.read(c=>v.rows(c,`SELECT POI_ID,CITY_ID,POI_NAME,POI_TYPE FROM ${names[item.slug]}`));
    assert.equal(records.length,expected.length);assert.equal(item.poiCount,expected.length);
    assert.ok(records.length,`${item.slug} should contain current demonstration rows`);
    for(const row of records)assert.ok(expected.some(p=>p.poiId===row.poiId && p.poiName===row.name));
    assert.equal(new Set(records.map(p=>p.poiId)).size,records.length,'Current views should not unintentionally duplicate POIs.');
    const city=records[0].cityId;
    const filtered=(await get(`/collections/${item.slug}?city=${city}&limit=100`)).data;
    assert.equal(filtered.length,records.filter(r=>r.cityId===city).length);
    const type=records[0].poiType.trim();
    assert.ok((await get(`/collections/${item.slug}?type=${type}&limit=100`)).data.every(p=>p.poiType.trim()===type));
    if(item.slug==='budget')for(const row of records){if(row.priceStatus==='FREE')assert.equal(row.price,0);if(row.priceStatus==='UNKNOWN')assert.equal(row.price,null);}
  }
  await get('/collections/not-a-collection',404);await get('/collections/popular?city=bad',400);await get('/collections/popular?type=DROP',400);
});
test('every existing trip dashboard matches independent membership/subtype/rating records',async()=>{
  const users=(await get('/users')).data;
  for(const user of users){const trips=(await get(`/users/${user.userId}/trips?limit=100`)).data;
    for(const trip of trips){
      const s=(await get(`/users/${user.userId}/trips/${trip.tripNo}/summary`)).data;
      const records=await db.read(c=>v.rows(c,`SELECT i.Itinerary_No,ip.POI_ID,p.POI_ID AS PLACE_ID,r.POI_ID AS RESTAURANT_ID,a.POI_ID AS ACTIVITY_ID,e.POI_ID AS EVENT_ID,
        (SELECT AVG(Rating) FROM REVIEW WHERE POI_ID=ip.POI_ID) AS RATING
        FROM ITINERARY i LEFT JOIN ITINERARY_POI ip ON ip.User_ID=i.User_ID AND ip.Itinerary_No=i.Itinerary_No
        LEFT JOIN PLACE p ON p.POI_ID=ip.POI_ID LEFT JOIN RESTAURANT r ON r.POI_ID=ip.POI_ID
        LEFT JOIN ACTIVITY a ON a.POI_ID=ip.POI_ID LEFT JOIN EVENT e ON e.POI_ID=ip.POI_ID
        WHERE i.User_ID=:userId AND i.Trip_No=:tripNo`,{userId:user.userId,tripNo:trip.tripNo}));
      assert.equal(s.itineraryCount,new Set(records.map(r=>r.itineraryNo)).size);
      const memberships=records.filter(r=>r.poiId!==null),unique=[...new Map(memberships.map(r=>[r.poiId,r])).values()];
      assert.equal(s.membershipCount,memberships.length);assert.equal(s.uniquePoiCount,unique.length);
      for(const [key,field] of [['placeCount','placeId'],['restaurantCount','restaurantId'],['activityCount','activityId'],['eventCount','eventId']])assert.equal(s[key],unique.filter(r=>r[field]!==null).length);
      const ratings=unique.filter(r=>r.rating!==null).map(r=>r.rating);
      assert.equal(s.reviewedPoiCount,ratings.length);
      assert.equal(s.averageRating,ratings.length?Number((ratings.reduce((n,r)=>n+r,0)/ratings.length).toFixed(2)):null);
    }
  }
  await get('/users/99999999/trips/1/summary',404);
});
