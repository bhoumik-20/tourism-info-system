'use strict';
const oracledb = require('oracledb');
async function main() {
  if (!process.env.DB_PASSWORD) {
    console.error('DB_PASSWORD is missing. Configure it locally in backend/.env; do not paste it into chat.');
    process.exitCode = 1;
    return;
  }
  let connection;
  try {
    oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR });
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });
    const result = await connection.execute(
      'SELECT USER AS SCHEMA_NAME, COUNT(*) AS CITY_COUNT FROM CITY',
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(JSON.stringify({ mode: 'Thick', driver: oracledb.versionString,
      client: oracledb.oracleClientVersionString, database: connection.oracleServerVersionString,
      result: result.rows[0] }, null, 2));
  } catch (error) {
    console.error(`Oracle connection check failed (${error.code || 'unknown error'}).`);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.close();
  }
}
main().catch(() => { console.error('Database check failed.'); process.exitCode = 1; });
