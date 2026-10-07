'use strict';
const db = require('../config/database');
const v = require('../validation');

const specs = {
  trips: { table: 'TRIP', number: 'TRIP_NO', name: 'TRIP_NAME', param: 'tripNo',
    select: `User_ID, Trip_No, Trip_Name, TO_CHAR(Start_Date, 'YYYY-MM-DD') AS Start_Date,
      TO_CHAR(End_Date, 'YYYY-MM-DD') AS End_Date, Description, Status` },
  itineraries: { table: 'ITINERARY', number: 'ITINERARY_NO', name: 'ITINERARY_NAME', param: 'itineraryNo',
    select: `User_ID, Itinerary_No, Itinerary_Name, TO_CHAR(Start_Date, 'YYYY-MM-DD') AS Start_Date,
      TO_CHAR(End_Date, 'YYYY-MM-DD') AS End_Date, Description, Trip_No` },
};
function keys(req, resource) {
  const binds = { userId: v.id(req.params.userId, 'userId') };
  if (resource && req.params[specs[resource].param] !== undefined) binds.itemNo = v.id(req.params[specs[resource].param], specs[resource].param, 999999);
  return binds;
}
async function user(c, userId, lock = false) {
  // Serialize number allocation and plan edits per user without locking the whole table.
  return v.one(c, `SELECT User_ID FROM APP_USER WHERE User_ID = :userId ${lock ? 'FOR UPDATE' : ''}`, { userId }, 'User not found.');
}
async function getItem(c, resource, binds) {
  const s = specs[resource];
  const data = await v.one(c, `SELECT ${s.select} FROM ${s.table} WHERE User_ID = :userId AND ${s.number} = :itemNo`, binds);
  if (resource === 'itineraries') data.pois = await v.rows(c, `SELECT p.POI_ID, p.Name, p.City_ID FROM ITINERARY_POI i
    JOIN POI p ON p.POI_ID = i.POI_ID WHERE i.User_ID = :userId AND i.Itinerary_No = :itemNo
    ORDER BY p.Name, p.POI_ID`, binds);
  return data;
}
function planBody(req, resource) {
  const s = specs[resource];
  const body = v.body(req, [resource === 'trips' ? 'tripName' : 'itineraryName', 'startDate', 'endDate', 'description', resource === 'trips' ? 'status' : 'tripNo']);
  const data = {
    name: v.text(body[resource === 'trips' ? 'tripName' : 'itineraryName'], s.param === 'tripNo' ? 'tripName' : 'itineraryName', 150, true),
    startDate: v.date(body.startDate, 'startDate'), endDate: v.date(body.endDate, 'endDate'),
    description: v.text(body.description, 'description', 1000),
  };
  if (data.startDate && data.endDate && data.endDate < data.startDate) v.fail(400, 'endDate must be on or after startDate.');
  if (resource === 'trips') data.status = v.text(body.status, 'status', 30);
  else data.tripNo = v.id(body.tripNo, 'tripNo', 999999);
  return data;
}
function list(resource) {
  return async (req, res) => {
    v.query(req, resource === 'itineraries' ? ['tripNo', 'page', 'limit'] : ['page', 'limit']);
    const binds = keys(req), pagination = v.page(req), s = specs[resource];
    let filter = '';
    if (req.query.tripNo !== undefined) { binds.tripNo = v.id(req.query.tripNo, 'tripNo', 999999); filter = ' AND Trip_No = :tripNo'; }
    const data = await db.read(async c => {
      await user(c, binds.userId);
      return v.paginate(c, `SELECT ${s.select} FROM ${s.table} WHERE User_ID = :userId ${filter} ORDER BY ${s.number}`, binds, pagination);
    });
    res.json(data);
  };
}
function detail(resource) {
  return async (req, res) => {
    const binds = keys(req, resource);
    res.json({ data: await db.read(c => getItem(c, resource, binds)) });
  };
}
function create(resource) {
  return async (req, res) => {
    const binds = { ...keys(req), ...planBody(req, resource) }, s = specs[resource];
    const data = await db.write(async c => {
      await user(c, binds.userId, true);
      if (resource === 'itineraries') await v.one(c, 'SELECT Trip_No FROM TRIP WHERE User_ID = :userId AND Trip_No = :tripNo', { userId: binds.userId, tripNo: binds.tripNo }, 'Trip not found for this user.');
      // Weak-entity numbers are local to their owning user, not global IDs.
      const next = await v.one(c, `SELECT NVL(MAX(${s.number}), 0) + 1 AS NEXT_NO FROM ${s.table} WHERE User_ID = :userId`, { userId: binds.userId });
      binds.itemNo = next.nextNo;
      if (binds.itemNo > 999999) v.fail(409, 'No more plan numbers are available for this user.');
      await c.execute(`INSERT INTO ${s.table} (User_ID, ${s.number}, ${s.name}, Start_Date, End_Date, Description, ${resource === 'trips' ? 'Status' : 'Trip_No'})
        VALUES (:userId, :itemNo, :name, TO_DATE(:startDate, 'YYYY-MM-DD'), TO_DATE(:endDate, 'YYYY-MM-DD'), :description, ${resource === 'trips' ? ':status' : ':tripNo'})`, binds);
      return getItem(c, resource, { userId: binds.userId, itemNo: binds.itemNo });
    });
    res.status(201).json({ data });
  };
}
function update(resource) {
  return async (req, res) => {
    const binds = { ...keys(req, resource), ...planBody(req, resource) }, s = specs[resource];
    const data = await db.write(async c => {
      await user(c, binds.userId, true);
      if (resource === 'itineraries') await v.one(c, 'SELECT Trip_No FROM TRIP WHERE User_ID = :userId AND Trip_No = :tripNo', { userId: binds.userId, tripNo: binds.tripNo }, 'Trip not found for this user.');
      await v.affected(c, `UPDATE ${s.table} SET ${s.name} = :name,
        Start_Date = TO_DATE(:startDate, 'YYYY-MM-DD'), End_Date = TO_DATE(:endDate, 'YYYY-MM-DD'),
        Description = :description, ${resource === 'trips' ? 'Status = :status' : 'Trip_No = :tripNo'}
        WHERE User_ID = :userId AND ${s.number} = :itemNo`, binds);
      return getItem(c, resource, { userId: binds.userId, itemNo: binds.itemNo });
    });
    res.json({ data });
  };
}
function remove(resource) {
  return async (req, res) => {
    const binds = keys(req, resource), s = specs[resource];
    await db.write(async c => {
      await user(c, binds.userId, true);
      if (resource === 'itineraries') await c.execute('DELETE FROM ITINERARY_POI WHERE User_ID = :userId AND Itinerary_No = :itemNo', binds);
      // Existing FKs have NO ACTION. Deleting a trip that has itineraries returns 409.
      await v.affected(c, `DELETE FROM ${s.table} WHERE User_ID = :userId AND ${s.number} = :itemNo`, binds);
    });
    res.status(204).end();
  };
}
async function saved(req, res) {
  v.query(req, ['page', 'limit']);
  const binds = keys(req), pagination = v.page(req);
  const data = await db.read(async c => {
    await user(c, binds.userId);
    return v.paginate(c, `SELECT p.* FROM USER_SAVES_POI s JOIN POI p ON p.POI_ID = s.POI_ID
      WHERE s.User_ID = :userId ORDER BY p.Name, p.POI_ID`, binds, pagination);
  });
  res.json(data);
}
async function save(req, res) {
  const binds = { ...keys(req), poiId: v.id(req.params.poiId, 'poiId') };
  await db.write(async c => {
    await user(c, binds.userId, true);
    await v.one(c, 'SELECT POI_ID FROM POI WHERE POI_ID = :poiId', { poiId: binds.poiId }, 'POI not found.');
    await c.execute(`INSERT INTO USER_SAVES_POI (User_ID, POI_ID) VALUES (:userId, :poiId)`, binds);
  });
  res.status(201).json({ data: binds });
}
async function unsave(req, res) {
  const binds = { ...keys(req), poiId: v.id(req.params.poiId, 'poiId') };
  await db.write(c => v.affected(c, 'DELETE FROM USER_SAVES_POI WHERE User_ID = :userId AND POI_ID = :poiId', binds));
  res.status(204).end();
}
async function addPoi(req, res) {
  const binds = { ...keys(req, 'itineraries'), poiId: v.id(req.params.poiId, 'poiId') };
  await db.write(async c => {
    await user(c, binds.userId, true);
    await getItem(c, 'itineraries', { userId: binds.userId, itemNo: binds.itemNo });
    await v.one(c, 'SELECT POI_ID FROM POI WHERE POI_ID = :poiId', { poiId: binds.poiId }, 'POI not found.');
    await c.execute('INSERT INTO ITINERARY_POI (User_ID, Itinerary_No, POI_ID) VALUES (:userId, :itemNo, :poiId)', binds);
  });
  res.status(201).json({ data: { userId: binds.userId, itineraryNo: binds.itemNo, poiId: binds.poiId } });
}
async function removePoi(req, res) {
  const binds = { ...keys(req, 'itineraries'), poiId: v.id(req.params.poiId, 'poiId') };
  await db.write(async c => {
    await user(c, binds.userId, true);
    await v.affected(c, 'DELETE FROM ITINERARY_POI WHERE User_ID = :userId AND Itinerary_No = :itemNo AND POI_ID = :poiId', binds);
  });
  res.status(204).end();
}
module.exports = { list, detail, create, update, remove, saved, save, unsave, addPoi, removePoi };
