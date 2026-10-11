'use strict';
const db = require('../config/database');
const v = require('../validation');
// Exact installed columns verified from USER_TAB_COLUMNS; these are read-only views.
const common = 'POI_ID, POI_NAME AS NAME, DESCRIPTION, CITY_ID, CITY_NAME, OPENING_HOURS, POI_TYPE';
const collections = {
  'top-rated': { title: 'Top Rated', description: 'Traveler favorites with a rating of 4.5 or higher.', view: 'VW_TOP_RATED_POIS',
    fields: 'AVERAGE_RATING, REVIEW_COUNT', order: 'AVERAGE_RATING DESC, REVIEW_COUNT DESC, POI_ID' },
  popular: { title: 'Popular', description: 'The discoveries travelers save and talk about most.', view: 'VW_POPULAR_POIS',
    fields: 'SAVE_COUNT, REVIEW_COUNT, AVERAGE_RATING, POPULARITY_SCORE, POPULARITY_RANK', order: 'POPULARITY_RANK, POI_ID' },
  budget: { title: 'Budget Experiences', description: 'Free and affordable discoveries, with unknown prices clearly marked.', view: 'VW_BUDGET_EXPERIENCES',
    fields: "PRICE, PRICE_STATUS, TO_CHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE, TO_CHAR(END_DATE, 'YYYY-MM-DD') AS END_DATE", order: 'PRICE ASC NULLS LAST, POI_ID' },
  foodie: { title: 'Foodie Favorites', description: 'Local kitchens, signature dishes and memorable meals.', view: 'VW_FOODIE_FAVORITES',
    fields: 'PRICE_RANGE, DELIVERY_AVAILABLE, TAKEAWAY_AVAILABLE, RESERVATION_AVAILABLE, OUTDOOR_SEATING, PARKING_AVAILABLE, SEATING_CAPACITY, CUISINES, FAMOUS_DISHES, AVERAGE_RATING, REVIEW_COUNT', order: 'AVERAGE_RATING DESC NULLS LAST, REVIEW_COUNT DESC, POI_ID' },
  upcoming: { title: 'Upcoming Events', description: 'Upcoming and ongoing celebrations from the city calendar.', view: 'VW_UPCOMING_EVENTS',
    fields: "EVENT_TYPE, TO_CHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE, TO_CHAR(END_DATE, 'YYYY-MM-DD') AS END_DATE, START_TIME, END_TIME, TICKET_PRICE, ORGANIZER, CAPACITY, REGISTRATION_REQUIRED, RESTAURANT_POI_ID, EVENT_STATUS", order: 'START_DATE, POI_ID' },
  'hidden-gems': { title: 'Hidden Gems', description: 'Well-loved discoveries with a little less bustle.', view: 'VW_HIDDEN_GEMS',
    fields: 'AVERAGE_RATING, REVIEW_COUNT, SAVE_COUNT, ENGAGEMENT_SCORE', order: 'AVERAGE_RATING DESC, ENGAGEMENT_SCORE, POI_ID' },
};
async function list(req, res) {
  v.query(req, []);
  const data = await db.read(async c => {
    const result = [];
    for (const [slug, item] of Object.entries(collections)) {
      const count = await v.one(c, `SELECT COUNT(*) AS POI_COUNT FROM ${item.view}`);
      result.push({ slug, title: item.title, description: item.description, poiCount: count.poiCount });
    }
    return result;
  });
  res.json({ data });
}
async function detail(req, res) {
  // A request can select a known collection but cannot supply a SQL identifier.
  const spec = Object.hasOwn(collections, req.params.slug) ? collections[req.params.slug] : null;
  if (!spec) v.fail(404, 'Collection not found.');
  v.query(req, ['city', 'type', 'page', 'limit']);
  const pagination = v.page(req), binds = {}, where = [];
  if (req.query.city !== undefined) { binds.cityId = v.id(req.query.city, 'city', 999999); where.push('CITY_ID = :cityId'); }
  if (req.query.type !== undefined) {
    binds.poiType = v.text(req.query.type, 'type', 20, true).toUpperCase();
    if (!['PLACE','RESTAURANT','ACTIVITY','EVENT','UNCLASSIFIED'].includes(binds.poiType)) v.fail(400, 'Invalid POI type.');
    where.push('TRIM(POI_TYPE) = :poiType');
  }
  const sql = `SELECT ${common}, ${spec.fields} FROM ${spec.view}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${spec.order}`;
  res.json(await db.read(c => v.paginate(c, sql, binds, pagination)));
}
module.exports = { list, detail };
