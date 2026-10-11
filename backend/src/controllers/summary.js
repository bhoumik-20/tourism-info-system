'use strict';
const db = require('../config/database');
const v = require('../validation');
// Each CTE has one job: isolate trip itineraries, deduplicate POIs, then aggregate.
// Average rating gives each reviewed unique POI equal weight, regardless of stop/review counts.
const sql = `WITH trip_itineraries AS (
    SELECT User_ID, Itinerary_No FROM ITINERARY
    WHERE User_ID = :userId AND Trip_No = :tripNo
  ), membership_totals AS (
    SELECT COUNT(ip.POI_ID) AS Membership_Count, COUNT(DISTINCT ip.POI_ID) AS Unique_POI_Count
    FROM trip_itineraries i LEFT JOIN ITINERARY_POI ip
      ON ip.User_ID = i.User_ID AND ip.Itinerary_No = i.Itinerary_No
  ), unique_pois AS (
    SELECT DISTINCT ip.POI_ID FROM trip_itineraries i JOIN ITINERARY_POI ip
      ON ip.User_ID = i.User_ID AND ip.Itinerary_No = i.Itinerary_No
  ), poi_ratings AS (
    SELECT r.POI_ID, AVG(r.Rating) AS Average_Rating
    FROM REVIEW r JOIN unique_pois u ON u.POI_ID = r.POI_ID GROUP BY r.POI_ID
  ), poi_totals AS (
    SELECT COUNT(p.POI_ID) AS Place_Count, COUNT(r.POI_ID) AS Restaurant_Count,
      COUNT(a.POI_ID) AS Activity_Count, COUNT(e.POI_ID) AS Event_Count,
      COUNT(pr.POI_ID) AS Reviewed_POI_Count, ROUND(AVG(pr.Average_Rating), 2) AS Average_Rating
    FROM unique_pois u LEFT JOIN PLACE p ON p.POI_ID = u.POI_ID
      LEFT JOIN RESTAURANT r ON r.POI_ID = u.POI_ID
      LEFT JOIN ACTIVITY a ON a.POI_ID = u.POI_ID
      LEFT JOIN EVENT e ON e.POI_ID = u.POI_ID
      LEFT JOIN poi_ratings pr ON pr.POI_ID = u.POI_ID
  ) SELECT t.User_ID, t.Trip_No, t.Trip_Name, t.Status,
    TO_CHAR(t.Start_Date, 'YYYY-MM-DD') AS Start_Date,
    TO_CHAR(t.End_Date, 'YYYY-MM-DD') AS End_Date,
    (SELECT COUNT(*) FROM trip_itineraries) AS Itinerary_Count,
    m.Membership_Count, m.Unique_POI_Count, p.Place_Count, p.Restaurant_Count,
    p.Activity_Count, p.Event_Count, p.Reviewed_POI_Count, p.Average_Rating
  FROM TRIP t CROSS JOIN membership_totals m CROSS JOIN poi_totals p
  WHERE t.User_ID = :userId AND t.Trip_No = :tripNo`;
async function detail(req, res) {
  const binds = { userId: v.id(req.params.userId, 'userId'), tripNo: v.id(req.params.tripNo, 'tripNo', 999999) };
  res.json({ data: await db.read(c => v.one(c, sql, binds, 'Trip not found for this profile.')) });
}
module.exports = { detail };
