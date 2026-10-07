'use strict';
const db = require('../src/config/database');
async function main() {
  await db.initialize();
  try {
    await db.read(async c => {
      const existing = await c.execute("SELECT Sequence_Name FROM USER_SEQUENCES WHERE Sequence_Name = 'REVIEW_ID_SEQ'");
      if (existing.rows.length) { console.log('REVIEW_ID_SEQ already exists; left unchanged.'); return; }
      const result = await c.execute('SELECT NVL(MAX(Review_ID), 0) + 1 AS NEXT_ID FROM REVIEW');
      const start = result.rows[0].NEXT_ID;
      if (!Number.isSafeInteger(start) || start < 1 || start > 9999999999) throw new Error('Invalid sequence start.');
      // Oracle does not accept binds in CREATE SEQUENCE. Only this validated integer is interpolated.
      // DDL commits implicitly; run setup separately from request transactions.
      await c.execute(`CREATE SEQUENCE REVIEW_ID_SEQ START WITH ${start} INCREMENT BY 1 MAXVALUE 9999999999 NOCYCLE NOCACHE`);
      console.log('Created REVIEW_ID_SEQ above the existing review IDs.');
    });
  } finally { await db.close(); }
}
main().catch(error => { console.error('Database setup failed:', error.code || 'SETUP_ERROR'); process.exitCode = 1; });
