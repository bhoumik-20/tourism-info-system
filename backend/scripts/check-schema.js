'use strict';
const db = require('../src/config/database');
async function main() {
  await db.initialize();
  try { await db.read(async c => {
    const expected = ['APP_USER_ID_SEQ','REVIEW_ID_SEQ','VW_TOP_RATED_POIS','VW_POPULAR_POIS','VW_BUDGET_EXPERIENCES','VW_FOODIE_FAVORITES','VW_UPCOMING_EVENTS','VW_HIDDEN_GEMS','TRG_REVIEW_TIMESTAMPS','TRG_ITINERARY_VALIDATE','TRG_TRIP_DATE_GUARD','TRG_ITINERARY_POI_GUARD'];
    const objects = (await c.execute("SELECT Object_Name, Status FROM USER_OBJECTS WHERE Object_Type IN ('VIEW','TRIGGER','SEQUENCE')")).rows;
    const missing = expected.filter(name => !objects.some(o => o.OBJECT_NAME === name && o.STATUS === 'VALID'));
    const triggers = (await c.execute('SELECT Trigger_Name, Status FROM USER_TRIGGERS')).rows;
    if (missing.length || triggers.some(t => expected.includes(t.TRIGGER_NAME) && t.STATUS !== 'ENABLED')) {
      console.error('Required objects are missing, invalid, or disabled. Install/repair them manually in SQL*Plus.'); process.exitCode = 1;
    } else console.log('All 6 views, 4 triggers and 2 sequences are valid; triggers are enabled. SELECT-only check.');
  }); } finally { await db.close(); }
}
main().catch(error => { console.error('Schema check failed:', error.code || 'CHECK_FAILED'); process.exitCode = 1; });
