'use strict';
const db = require('../config/database');
const v = require('../validation');

function reviewBody(req, creating = false) {
  const body = v.body(req, creating ? ['userId', 'rating', 'comments'] : ['rating', 'comments']);
  const rating = v.number(body.rating, 'rating', 1, 5);
  if (Math.abs(rating * 10 - Math.round(rating * 10)) > 1e-8) v.fail(400, 'rating supports one decimal place.');
  const result = { rating, comments: v.text(body.comments, 'comments', 1000) };
  if (creating) result.userId = v.id(body.userId, 'userId');
  return result;
}
const select = `SELECT r.*, u.First_Name, u.Last_Name FROM REVIEW r
  JOIN APP_USER u ON u.User_ID = r.User_ID`;
async function list(req, res) {
  v.query(req, ['page', 'limit']);
  const poiId = v.id(req.params.id, 'poiId'), pagination = v.page(req);
  const data = await db.read(async c => {
    await v.one(c, 'SELECT POI_ID FROM POI WHERE POI_ID = :poiId', { poiId });
    return v.paginate(c, `${select} WHERE r.POI_ID = :poiId ORDER BY r.Review_Date DESC, r.Review_ID DESC`, { poiId }, pagination);
  });
  res.json(data);
}
async function create(req, res) {
  const binds = { ...reviewBody(req, true), poiId: v.id(req.params.id, 'poiId') };
  const data = await db.write(async c => {
    await v.one(c, 'SELECT User_ID FROM APP_USER WHERE User_ID = :userId', { userId: binds.userId }, 'User not found.');
    await v.one(c, 'SELECT POI_ID FROM POI WHERE POI_ID = :poiId', { poiId: binds.poiId }, 'POI not found.');
    const result = await c.execute(`INSERT INTO REVIEW (Review_ID, Rating, Comments, Review_Date, User_ID, POI_ID)
      VALUES (REVIEW_ID_SEQ.NEXTVAL, :rating, :comments, SYSDATE, :userId, :poiId)
      RETURNING Review_ID INTO :reviewId`, {
      ...binds, reviewId: { dir: db.oracledb.BIND_OUT, type: db.oracledb.NUMBER },
    });
    return v.one(c, `${select} WHERE r.Review_ID = :reviewId`, { reviewId: result.outBinds.reviewId[0] });
  });
  res.status(201).json({ data });
}
async function update(req, res) {
  const binds = { ...reviewBody(req), reviewId: v.id(req.params.id, 'reviewId', 9999999999) };
  const data = await db.write(async c => {
    await v.affected(c, `UPDATE REVIEW SET Rating = :rating, Comments = :comments, Last_Updated = SYSDATE
      WHERE Review_ID = :reviewId`, binds);
    return v.one(c, `${select} WHERE r.Review_ID = :reviewId`, { reviewId: binds.reviewId });
  });
  res.json({ data });
}
async function remove(req, res) {
  const reviewId = v.id(req.params.id, 'reviewId', 9999999999);
  await db.write(c => v.affected(c, 'DELETE FROM REVIEW WHERE Review_ID = :reviewId', { reviewId }));
  res.status(204).end();
}
module.exports = { list, create, update, remove };
