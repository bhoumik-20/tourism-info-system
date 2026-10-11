'use strict';
const db = require('../config/database');
const v = require('../validation');
const fields = `u.User_ID, u.First_Name, u.Middle_Name, u.Last_Name, u.Email,
  u.Phone_Number, TO_CHAR(u.Date_of_Birth, 'YYYY-MM-DD') AS Date_of_Birth, u.Profile_Image`;
async function profile(c, userId) {
  // Separate aggregates prevent multiplying counts across one-to-many joins.
  return v.one(c, `SELECT ${fields},
    (SELECT COUNT(*) FROM REVIEW r WHERE r.User_ID = u.User_ID) AS Review_Count,
    (SELECT COUNT(*) FROM USER_SAVES_POI s WHERE s.User_ID = u.User_ID) AS Saved_POI_Count,
    (SELECT COUNT(*) FROM TRIP t WHERE t.User_ID = u.User_ID) AS Trip_Count,
    (SELECT COUNT(*) FROM ITINERARY i WHERE i.User_ID = u.User_ID) AS Itinerary_Count
    FROM APP_USER u WHERE u.User_ID = :userId`, { userId }, 'Profile not found.');
}
async function list(req, res) {
  v.query(req, []);
  const data = await db.read(c => v.rows(c, `SELECT User_ID, First_Name, Middle_Name, Last_Name, Profile_Image
    FROM APP_USER ORDER BY First_Name, Last_Name, User_ID`));
  res.json({ data });
}
async function detail(req, res) {
  const userId = v.id(req.params.userId, 'userId');
  res.json({ data: await db.read(c => profile(c, userId)) });
}
function input(req) {
  const b = v.body(req, ['firstName', 'middleName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'profileImage']);
  const result = {
    firstName: v.text(b.firstName, 'firstName', 50, true),
    middleName: v.text(b.middleName, 'middleName', 50),
    lastName: v.text(b.lastName, 'lastName', 50),
    email: v.text(b.email, 'email', 150, true),
    phoneNumber: v.text(b.phoneNumber, 'phoneNumber', 20),
    dateOfBirth: v.date(b.dateOfBirth, 'dateOfBirth'),
    profileImage: v.text(b.profileImage, 'profileImage', 500),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) v.fail(400, 'Enter a valid email address.');
  if (result.profileImage) {
    let url;
    try { url = new URL(result.profileImage); } catch { v.fail(400, 'Profile image must be an http or https URL.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) v.fail(400, 'Profile image must be an http or https URL without credentials.');
  }
  return result;
}
async function create(req, res) {
  const binds = input(req);
  const data = await db.write(async c => {
    // This sequence was installed manually by the user. No runtime DDL.
    const result = await c.execute(`INSERT INTO APP_USER
      (User_ID, First_Name, Middle_Name, Last_Name, Email, Phone_Number, Date_of_Birth, Profile_Image)
      VALUES (APP_USER_ID_SEQ.NEXTVAL, :firstName, :middleName, :lastName, :email,
        :phoneNumber, TO_DATE(:dateOfBirth, 'YYYY-MM-DD'), :profileImage)
      RETURNING User_ID INTO :userId`, {
      ...binds, userId: { dir: db.oracledb.BIND_OUT, type: db.oracledb.NUMBER },
    });
    return profile(c, result.outBinds.userId[0]);
  });
  res.status(201).json({ data });
}
async function update(req, res) {
  const binds = { ...input(req), userId: v.id(req.params.userId, 'userId') };
  const data = await db.write(async c => {
    await v.affected(c, `UPDATE APP_USER SET First_Name = :firstName, Middle_Name = :middleName,
      Last_Name = :lastName, Email = :email, Phone_Number = :phoneNumber,
      Date_of_Birth = TO_DATE(:dateOfBirth, 'YYYY-MM-DD'), Profile_Image = :profileImage
      WHERE User_ID = :userId`, binds);
    return profile(c, binds.userId);
  });
  res.json({ data });
}
module.exports = { list, detail, create, update };
