'use strict';
const db = require('../config/database');
const v = require('../validation');

// Table/column names below are fixed application constants, never request values.
const types = {
  places: { table: 'PLACE', fields: 's.Entry_Fee, s.Established_Year, s.Accessibility_Info',
    arrays: [['categories', 'PLACE_CATEGORY', 'CATEGORY']] },
  restaurants: { table: 'RESTAURANT', fields: `s.Price_Range, s.Delivery_Available, s.Takeaway_Available,
    s.Reservation_Available, s.Outdoor_Seating, s.Private_Dining, s.Catering_Available,
    s.Parking_Available, s.Seating_Capacity, s.Reservation_Policy, s.Cancellation_Policy`,
    arrays: [['cuisines', 'RESTAURANT_CUISINE', 'CUISINE'], ['famousDishes', 'RESTAURANT_DISH', 'FAMOUS_DISH'],
      ['diningTypes', 'RESTAURANT_DINING_TYPE', 'DINING_TYPE'], ['ambience', 'RESTAURANT_AMBIENCE', 'AMBIENCE'],
      ['parkingTypes', 'RESTAURANT_PARKING_TYPE', 'PARKING_TYPE'], ['accessibility', 'RESTAURANT_ACCESSIBILITY', 'ACCESSIBILITY'],
      ['paymentMethods', 'RESTAURANT_PAYMENT_METHOD', 'PAYMENT_METHOD']] },
  activities: { table: 'ACTIVITY', fields: `s.Activity_Type, s.Difficulty_Level, s.Duration, s.Cost,
    s.Minimum_Age, s.Maximum_Age, s.Safety_Information`,
    arrays: [['seasons', 'ACTIVITY_SEASON', 'SEASON'], ['equipment', 'ACTIVITY_EQUIPMENT', 'EQUIPMENT']] },
  events: { table: 'EVENT', fields: `s.Event_Type, TO_CHAR(s.Start_Date, 'YYYY-MM-DD') AS Start_Date,
    TO_CHAR(s.End_Date, 'YYYY-MM-DD') AS End_Date, s.Start_Time, s.End_Time, s.Ticket_Price,
    s.Organizer, s.Capacity, s.Registration_Required, s.Restaurant_POI_ID`, arrays: [] },
};
const base = `SELECT p.*, c.City_Name, NVL(r.Review_Count, 0) AS Review_Count,
  r.Average_Rating`;
const joins = `FROM POI p JOIN CITY c ON c.City_ID = p.City_ID
  LEFT JOIN (SELECT POI_ID, COUNT(*) AS Review_Count, ROUND(AVG(Rating), 2) AS Average_Rating
    FROM REVIEW GROUP BY POI_ID) r ON r.POI_ID = p.POI_ID`;

async function cities(req, res) {
  v.query(req, []);
  const data = await db.read(c => v.rows(c, 'SELECT * FROM CITY ORDER BY City_Name, City_ID'));
  res.json({ data });
}
async function city(req, res) {
  const cityId = v.id(req.params.id, 'cityId', 999999);
  const data = await db.read(c => v.one(c, 'SELECT * FROM CITY WHERE City_ID = :cityId', { cityId }));
  res.json({ data });
}
async function users(req, res) {
  v.query(req, []);
  // Demo selector: do not expose email, phone, birth date, or profile images.
  const data = await db.read(c => v.rows(c, 'SELECT User_ID, First_Name, Last_Name FROM APP_USER ORDER BY User_ID'));
  res.json({ data });
}

function list(resource) {
  return async (req, res) => {
    const spec = types[resource];
    const allowed = ['city', 'search', 'minRating', 'page', 'limit'];
    if (!spec) allowed.push('type');
    if (resource === 'places') allowed.push('category');
    if (resource === 'restaurants') allowed.push('cuisine', 'priceRange', 'delivery', 'parking');
    if (resource === 'activities') allowed.push('activityType', 'difficulty', 'season', 'maxCost');
    if (resource === 'events') allowed.push('eventType', 'from', 'to');
    v.query(req, allowed);
    const pagination = v.page(req);
    const where = [], binds = {};
    if (req.query.city !== undefined) {
      where.push('p.City_ID = :cityId'); binds.cityId = v.id(req.query.city, 'city', 999999);
    }
    if (req.query.search !== undefined) {
      where.push("(LOWER(p.Name) LIKE :search ESCAPE '!' OR LOWER(p.Description) LIKE :search ESCAPE '!')");
      binds.search = v.like(v.text(req.query.search, 'search', 150, true).toLowerCase());
    }
    if (req.query.minRating !== undefined) {
      where.push('r.Average_Rating >= :minRating'); binds.minRating = v.number(req.query.minRating, 'minRating', 1, 5);
    }
    if (req.query.type !== undefined) {
      const choice = types[req.query.type];
      if (!choice) v.fail(400, 'type must be places, restaurants, activities, or events.');
      where.push(`EXISTS (SELECT 1 FROM ${choice.table} t WHERE t.POI_ID = p.POI_ID)`);
    }
    for (const [key, column] of [['priceRange', 'Price_Range'], ['activityType', 'Activity_Type'], ['difficulty', 'Difficulty_Level'], ['eventType', 'Event_Type']]) {
      if (req.query[key] !== undefined) {
        where.push(`LOWER(s.${column}) = LOWER(:${key})`); binds[key] = v.text(req.query[key], key, 100, true);
      }
    }
    for (const [key, table, column] of [['category', 'PLACE_CATEGORY', 'CATEGORY'], ['cuisine', 'RESTAURANT_CUISINE', 'CUISINE'], ['season', 'ACTIVITY_SEASON', 'SEASON']]) {
      if (req.query[key] !== undefined) {
        where.push(`EXISTS (SELECT 1 FROM ${table} f WHERE f.POI_ID = p.POI_ID AND LOWER(f.${column}) = LOWER(:${key}))`);
        binds[key] = v.text(req.query[key], key, 100, true);
      }
    }
    for (const [key, column] of [['delivery', 'Delivery_Available'], ['parking', 'Parking_Available']]) {
      if (req.query[key] !== undefined) {
        if (!['Y', 'N'].includes(req.query[key])) v.fail(400, `${key} must be Y or N.`);
        where.push(`s.${column} = :${key}`); binds[key] = req.query[key];
      }
    }
    if (req.query.maxCost !== undefined) {
      where.push('s.Cost <= :maxCost'); binds.maxCost = v.number(req.query.maxCost, 'maxCost', 0, 99999999.99);
    }
    if (req.query.from !== undefined) {
      binds.fromDate = v.date(req.query.from, 'from');
      where.push("s.End_Date >= TO_DATE(:fromDate, 'YYYY-MM-DD')");
    }
    if (req.query.to !== undefined) {
      binds.toDate = v.date(req.query.to, 'to');
      where.push("s.Start_Date < TO_DATE(:toDate, 'YYYY-MM-DD') + 1");
    }
    if (binds.fromDate && binds.toDate && binds.toDate < binds.fromDate) v.fail(400, 'to must be on or after from.');
    const sql = `${base}${spec ? ', ' + spec.fields : ''} ${joins}
      ${spec ? `JOIN ${spec.table} s ON s.POI_ID = p.POI_ID` : ''}
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.Name, p.POI_ID`;
    res.json(await db.read(c => v.paginate(c, sql, binds, pagination)));
  };
}

async function addArrays(c, spec, row, poiId) {
  for (const [key, table, column] of spec.arrays) {
    const values = await v.rows(c, `SELECT ${column} AS VALUE FROM ${table} WHERE POI_ID = :poiId ORDER BY ${column}`, { poiId });
    row[key] = values.map(value => value.value);
  }
  if (spec.table === 'ACTIVITY') row.locations = await v.rows(c, `
    SELECT p.POI_ID, p.Name, p.City_ID FROM ACTIVITY_LOCATION l
    JOIN POI p ON p.POI_ID = l.Location_POI_ID
    WHERE l.Activity_POI_ID = :poiId ORDER BY p.Name, p.POI_ID`, { poiId });
}
function detail(resource) {
  return async (req, res) => {
    const poiId = v.id(req.params.id, 'poiId');
    const spec = types[resource];
    const data = await db.read(async c => {
      const row = await v.one(c, `${base}${spec ? ', ' + spec.fields : ''} ${joins}
        ${spec ? `JOIN ${spec.table} s ON s.POI_ID = p.POI_ID` : ''} WHERE p.POI_ID = :poiId`, { poiId });
      row.contacts = (await v.rows(c, 'SELECT Contact_Number FROM POI_CONTACT WHERE POI_ID = :poiId ORDER BY Contact_Number', { poiId })).map(x => x.contactNumber);
      row.nearby = await v.rows(c, `SELECT p.POI_ID, p.Name, p.City_ID FROM POI p
        WHERE p.POI_ID IN (
          SELECT POI_ID_2 FROM POI_NEARBY WHERE POI_ID_1 = :poiId
          UNION SELECT POI_ID_1 FROM POI_NEARBY WHERE POI_ID_2 = :poiId
        ) ORDER BY p.Name, p.POI_ID`, { poiId });
      if (spec) await addArrays(c, spec, row, poiId);
      else {
        for (const [name, subtype] of Object.entries(types)) {
          const found = await v.rows(c, `SELECT ${subtype.fields} FROM ${subtype.table} s WHERE s.POI_ID = :poiId`, { poiId });
          if (found.length) { await addArrays(c, subtype, found[0], poiId); row[name] = found[0]; }
        }
      }
      return row;
    });
    res.json({ data });
  };
}
module.exports = { cities, city, users, list, detail };
