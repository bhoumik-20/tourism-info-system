'use strict';
const oracledb = require('oracledb');
let pool;

async function initialize() {
  for (const name of ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING', 'ORACLE_CLIENT_LIB_DIR']) {
    if (!process.env[name]) throw new Error(`Configure ${name} locally in backend/.env.`);
  }
  // XE 11g cannot use Thin mode. Explicitly select the compatible XE client.
  oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR });
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin: 1, poolMax: 4, poolIncrement: 1,
    queueTimeout: 10000,
  });
  console.log('Database is connected..');
}

async function read(work) {
  const connection = await pool.getConnection();
  try { return await work(connection); }
  finally { await connection.close(); }
}

async function write(work) {
  const connection = await pool.getConnection();
  try {
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { await connection.close(); }
}

async function close() { if (pool) await pool.close(10); }
module.exports = { initialize, read, write, close, oracledb };
