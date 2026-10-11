import test from 'node:test';
import assert from 'node:assert/strict';
import { readProfile, persistProfile, PROFILE_KEY, fullName } from '../src/context/profileSelection.js';
import { createMockRepository } from '../src/services/mockRepository.js';
test('profile selection persists independently of demo records and invalid storage selects nobody', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key,value) => values.set(key,value), removeItem: key => values.delete(key) };
  assert.equal(readProfile(storage), null); persistProfile(storage, 3); assert.equal(readProfile(storage), 3);
  persistProfile(storage, null); assert.equal(readProfile(storage), null);
  for (const invalid of ['0','-1','NaN','1e2','999999999','abc']) { values.set(PROFILE_KEY, invalid); assert.equal(readProfile(storage),null); }
  assert.equal(readProfile({getItem() { throw new Error('unavailable'); }}), null);
  assert.doesNotThrow(() => persistProfile({setItem() { throw new Error('unavailable'); }}, 2));
  assert.equal(fullName({firstName:'Aarav',middleName:'K',lastName:'Sharma'}), 'Aarav K Sharma');
});
test('offline profiles persist, auto-selectable IDs are real records, and aggregates remain user-scoped', async () => {
  const values = new Map();
  const storage = { getItem:key=>values.get(key), setItem:(key,value)=>values.set(key,value) };
  const repo=createMockRepository(storage);
  const user=await repo.createProfile({firstName:'Temporary',email:'temporary@example.invalid'});
  assert.ok((await repo.bootstrap(user.userId)).users.some(u=>u.userId===user.userId));
  assert.equal((await repo.getProfile(user.userId)).tripCount,0);
  await repo.savePoi(user.userId,3,true);
  assert.equal((await repo.getProfile(user.userId)).savedPoiCount,1);
  assert.ok(!(await repo.bootstrap(2)).saved.includes(3));
  assert.equal((await createMockRepository(storage).getProfile(user.userId)).firstName,'Temporary');
});
