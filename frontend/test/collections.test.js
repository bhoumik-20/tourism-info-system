import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeCollectionPoi,collectionPrice} from '../src/services/collections.js';
import {createMockRepository} from '../src/services/mockRepository.js';
test('collection rows preserve original POI IDs, distinguish unknown/free prices and normalize view types',()=>{
 const row=normalizeCollectionPoi({poiId:213,poiName:'Festival',poiType:'EVENT ',price:null,priceStatus:'UNKNOWN'});
 assert.equal(row.poiId,213);assert.equal(row.name,'Festival');assert.equal(row.type,'events');
 assert.equal(collectionPrice(row,String),'Price not listed');assert.equal(collectionPrice({price:0,priceStatus:'FREE'},String),'Free');
 assert.equal(collectionPrice({price:500,priceStatus:'PAID'},String),'500');
 assert.deepEqual(normalizeCollectionPoi({poiId:2,poiType:'RESTAURANT',cuisines:'Indian, Parsi'}).cuisines,['Indian','Parsi']);
});
test('offline dashboard counts memberships separately from unique POIs and does not invent Oracle collections',async()=>{
 const repo=createMockRepository();await assert.rejects(repo.getCollection('popular'),/live Oracle/);
 const trip=await repo.writePlan('trips',2,null,{tripName:'Test dashboard'});
 const one=await repo.writePlan('itineraries',2,null,{itineraryName:'One',tripNo:trip.tripNo});
 const two=await repo.writePlan('itineraries',2,null,{itineraryName:'Two',tripNo:trip.tripNo});
 await repo.itineraryPoi(2,one.itineraryNo,3,true);await repo.itineraryPoi(2,two.itineraryNo,3,true);
 const summary=await repo.getTripSummary(2,trip.tripNo);assert.equal(summary.uniquePoiCount,1);assert.equal(summary.membershipCount,2);assert.equal(summary.itineraryCount,2);
});
