'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const db=require('../src/config/database'),v=require('../src/validation'),app=require('../src/app');
let server,base,baseline,users=[],tripA,tripB,itinA,itinB;
const run=`${Date.now()}`;
async function snapshot(){return db.read(async c=>{
  const result={};for(const {tableName} of await v.rows(c,'SELECT Table_Name FROM USER_TABLES ORDER BY Table_Name')){
    assert.match(tableName,/^[A-Z_]+$/);const records=await v.rows(c,`SELECT * FROM ${tableName}`);
    result[tableName]={count:records.length,hash:createHash('sha256').update(JSON.stringify(records.map(r=>JSON.stringify(r)).sort())).digest('hex')};
  }return result;
});}
async function req(method,path,body,status=200,code){const response=await fetch(base+path,{method,headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
  assert.equal(response.status,status,`${method} ${path}`);if(status===204)return null;const payload=await response.json();if(code)assert.equal(payload.code,code);return payload.data;
}
before(async()=>{
  if(process.env.VOYAGE_LIVE_TESTS_APPROVED!=='1')throw new Error('Live write tests require user approval of TEST_PLAN_PHASE2.md. No writes were performed.');
  await db.initialize();baseline=await snapshot();server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/api`;
  for(const suffix of ['A','B']){
    const user=await req('POST','/users',{firstName:`VoyageTest${suffix}`,lastName:run,email:`voyage-phase2-${run}-${suffix}@example.invalid`,dateOfBirth:'2000-01-02'},201);users.push(user);
  }
});
after(async()=>{
  try{if(users.length)await db.write(async c=>{for(const user of users){const binds={userId:user.userId};
    // Only this run's newly created profiles and their dependent rows are removed.
    for(const table of ['ITINERARY_POI','ITINERARY','TRIP','REVIEW','USER_SAVES_POI','APP_USER'])await c.execute(`DELETE FROM ${table} WHERE User_ID=:userId`,binds);
  }});if(baseline)assert.deepEqual(await snapshot(),baseline,'All 25 existing tables must match the initial row hashes and counts.');}
  finally{if(server)await new Promise(r=>server.close(r));await db.close();}
});
test('new profiles persist, retain existing attributes, update, and reject duplicate emails',async()=>{
  for(const user of users){const found=await req('GET',`/users/${user.userId}`);assert.equal(found.email,user.email);assert.equal(found.dateOfBirth,'2000-01-02');assert.equal(found.tripCount,0);}
  const saved=await db.read(c=>v.one(c,'SELECT COUNT(*) AS N FROM APP_USER WHERE User_ID=:userId AND Email=:email',{userId:users[0].userId,email:users[0].email}));assert.equal(saved.n,1);
  await req('POST','/users',{firstName:'Duplicate test',email:users[0].email},409,'ORA-00001');
  await req('POST','/users',{email:'missing-name@example.invalid'},400);
  const changed=await req('PUT',`/users/${users[0].userId}`,{firstName:'VoyageTestA',middleName:'Profile',lastName:run,email:users[0].email,phoneNumber:'0000000000',dateOfBirth:'2000-01-02'});assert.equal(changed.middleName,'Profile');
});
test('reviews, saves, trips and itineraries use their profile and reject cross-profile review edits',async()=>{
  const poi=await db.read(c=>v.one(c,'SELECT MIN(POI_ID) AS ID FROM PLACE'));
  const review=await req('POST',`/pois/${poi.id}/reviews`,{userId:users[0].userId,rating:4.5,comments:`Voyage Phase 2 ${run}`},201);assert.equal(review.userId,users[0].userId);assert.ok(review.reviewDate && review.lastUpdated);
  await req('PUT',`/reviews/${review.reviewId}`,{userId:users[1].userId,rating:1},404);
  await req('DELETE',`/reviews/${review.reviewId}?userId=${users[1].userId}`,undefined,404);
  const updated=await req('PUT',`/reviews/${review.reviewId}`,{userId:users[0].userId,rating:4,comments:'Updated test review'});assert.equal(updated.reviewDate,review.reviewDate);
  await req('POST',`/users/${users[0].userId}/saved-pois/${poi.id}`,undefined,201);
  assert.equal((await req('GET',`/users/${users[0].userId}/saved-pois`)).length,1);assert.equal((await req('GET',`/users/${users[1].userId}/saved-pois`)).length,0);
  const body={tripName:`Voyage phase2 ${run}`,startDate:'2026-12-01',endDate:'2026-12-31',status:'Planned'};
  tripA=await req('POST',`/users/${users[0].userId}/trips`,body,201);tripB=await req('POST',`/users/${users[1].userId}/trips`,{...body,tripName:'Other profile test'},201);
  assert.equal(tripA.tripNo,1);assert.equal(tripB.tripNo,1);assert.notEqual(tripA.userId,tripB.userId);
  itinA=await req('POST',`/users/${users[0].userId}/itineraries`,{itineraryName:'Phase2 full month',tripNo:tripA.tripNo,startDate:'2026-12-01',endDate:'2026-12-31'},201);
  itinB=await req('POST',`/users/${users[0].userId}/itineraries`,{itineraryName:'Phase2 short dates',tripNo:tripA.tripNo,startDate:'2026-12-01',endDate:'2026-12-03'},201);
  await req('GET',`/users/${users[1].userId}/itineraries/${itinA.itineraryNo}`,undefined,404);
  const profile=await req('GET',`/users/${users[0].userId}`);assert.equal(profile.reviewCount,1);assert.equal(profile.savedPoiCount,1);assert.equal(profile.tripCount,1);assert.equal(profile.itineraryCount,2);
});
test('all six collections add original POIs to real itineraries and handle duplicate memberships',async()=>{
  const collections=await req('GET','/collections');
  for(const collection of collections){
    const records=await req('GET',`/collections/${collection.slug}?limit=100`);assert.ok(records.length);
    const poi=records[0],path=`/users/${users[0].userId}/itineraries/${itinA.itineraryNo}/pois/${poi.poiId}`;
    const added=await req('POST',path,undefined,201);assert.equal(added.poiId,poi.poiId);
    await req('POST',path,undefined,409,'ORA-00001');
    assert.ok((await req('GET',`/users/${users[0].userId}/itineraries/${itinA.itineraryNo}`)).pois.some(p=>p.poiId===poi.poiId));
    assert.equal((await req('GET',`/users/${users[0].userId}/trips/${tripA.tripNo}/summary`)).membershipCount,1);
    await req('DELETE',path,undefined,204);
  }
});
test('installed itinerary, trip-date and event triggers return their real codes via Express',async()=>{
  const userId=users[0].userId,collection=`/users/${userId}/itineraries`;
  await req('POST',collection,{itineraryName:'Missing dates',tripNo:tripA.tripNo},400,'ORA-20013');
  await req('POST',collection,{itineraryName:'Outside parent',tripNo:tripA.tripNo,startDate:'2026-11-01',endDate:'2026-11-02'},400,'ORA-20014');
  const event=await db.read(c=>v.one(c,'SELECT MIN(POI_ID) AS ID FROM EVENT'));
  await req('POST',`${collection}/${itinB.itineraryNo}/pois/${event.id}`,undefined,409,'ORA-20033');
  await req('POST',`${collection}/${itinA.itineraryNo}/pois/${event.id}`,undefined,201);
  await req('PUT',`${collection}/${itinA.itineraryNo}`,{itineraryName:'Conflicting edit',tripNo:tripA.tripNo,startDate:'2026-12-01',endDate:'2026-12-03'},409,'ORA-20015');
  await req('PUT',`/users/${userId}/trips/${tripA.tripNo}`,{tripName:'Invalidating edit',status:'Planned',startDate:'2026-12-01',endDate:'2026-12-03'},409,'ORA-20023');
  assert.equal((await req('GET',`${collection}/${itinA.itineraryNo}`)).endDate,'2026-12-31');
  await req('DELETE',`${collection}/${itinA.itineraryNo}/pois/${event.id}`,undefined,204);
});
test('dashboard deduplicates repeated POIs and computes all subtype and rating metrics',async()=>{
  const userId=users[0].userId;
  await req('PUT',`/users/${userId}/itineraries/${itinB.itineraryNo}`,{itineraryName:'Phase2 second itinerary',tripNo:tripA.tripNo,startDate:'2026-12-01',endDate:'2026-12-31'});
  const ids=await db.read(async c=>{const result=[];for(const table of ['PLACE','RESTAURANT','ACTIVITY','EVENT'])result.push((await v.one(c,`SELECT MIN(POI_ID) AS ID FROM ${table}`)).id);return result;});
  for(const poiId of ids)await req('POST',`/users/${userId}/itineraries/${itinA.itineraryNo}/pois/${poiId}`,undefined,201);
  await req('POST',`/users/${userId}/itineraries/${itinB.itineraryNo}/pois/${ids[0]}`,undefined,201);
  const s=await req('GET',`/users/${userId}/trips/${tripA.tripNo}/summary`);
  assert.equal(s.itineraryCount,2);assert.equal(s.uniquePoiCount,4);assert.equal(s.membershipCount,5);
  for(const key of ['placeCount','restaurantCount','activityCount','eventCount'])assert.equal(s[key],1);
  const expected=await db.read(c=>v.one(c,`SELECT ROUND(AVG(Rating),2) AS N FROM
    (SELECT POI_ID,AVG(Rating) AS Rating FROM REVIEW WHERE POI_ID IN (:p1,:p2,:p3,:p4) GROUP BY POI_ID)`,{p1:ids[0],p2:ids[1],p3:ids[2],p4:ids[3]}));assert.equal(s.averageRating,expected.n);
  const empty=await req('GET',`/users/${users[1].userId}/trips/${tripB.tripNo}/summary`);assert.equal(empty.uniquePoiCount,0);assert.equal(empty.averageRating,null);
});
test('completed-trip guards and remaining error codes are tested in one rolled-back transaction',async()=>{
  await db.read(async c=>{try{
    const binds={userId:users[0].userId,itemNo:999998};
    const place=(await v.one(c,'SELECT MIN(POI_ID) AS ID FROM PLACE')).id;
    const event=(await v.one(c,'SELECT MIN(POI_ID) AS ID FROM EVENT')).id;
    await c.execute("INSERT INTO TRIP(User_ID,Trip_No,Trip_Name,Start_Date,End_Date,Status) VALUES(:userId,:itemNo,'Rollback guard test',DATE '2026-12-01',DATE '2026-12-31','Planned')",binds);
    await c.execute("INSERT INTO ITINERARY(User_ID,Itinerary_No,Itinerary_Name,Start_Date,End_Date,Trip_No) VALUES(:userId,:itemNo,'Rollback guard itinerary',DATE '2026-12-01',DATE '2026-12-31',:itemNo)",binds);
    await c.execute('INSERT INTO ITINERARY_POI(User_ID,Itinerary_No,POI_ID) VALUES(:userId,:itemNo,:poiId)',{...binds,poiId:place});
    const reject=async(sql,b,number)=>assert.rejects(c.execute(sql,b),e=>e.errorNum===number);
    await reject("UPDATE TRIP SET Start_Date=DATE '2026-12-31',End_Date=DATE '2026-12-01' WHERE User_ID=:userId AND Trip_No=:itemNo",binds,20022);
    await reject("INSERT INTO ITINERARY(User_ID,Itinerary_No,Itinerary_Name,Start_Date,End_Date,Trip_No) VALUES(:userId,999997,'Missing parent',DATE '2026-12-01',DATE '2026-12-31',999997)",{userId:binds.userId},20012);
    await reject('INSERT INTO ITINERARY_POI(User_ID,Itinerary_No,POI_ID) VALUES(:userId,999997,:poiId)',{userId:binds.userId,poiId:place},20032);
    await c.execute("UPDATE TRIP SET Status='Completed' WHERE User_ID=:userId AND Trip_No=:itemNo",binds);
    await reject("UPDATE TRIP SET Trip_Name='Blocked' WHERE User_ID=:userId AND Trip_No=:itemNo",binds,20021);
    await reject('DELETE FROM TRIP WHERE User_ID=:userId AND Trip_No=:itemNo',binds,20021);
    await reject("UPDATE ITINERARY SET Itinerary_Name='Blocked' WHERE User_ID=:userId AND Itinerary_No=:itemNo",binds,20011);
    await reject('DELETE FROM ITINERARY WHERE User_ID=:userId AND Itinerary_No=:itemNo',binds,20011);
    await reject('DELETE FROM ITINERARY_POI WHERE User_ID=:userId AND Itinerary_No=:itemNo',binds,20031);
    await reject('INSERT INTO ITINERARY_POI(User_ID,Itinerary_No,POI_ID) VALUES(:userId,:itemNo,:poiId)',{...binds,poiId:event},20031);
  }finally{await c.rollback();}});
});
