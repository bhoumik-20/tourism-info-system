'use strict';
const router = require('express').Router();
const catalog = require('../controllers/catalog');
const reviews = require('../controllers/reviews');
const plans = require('../controllers/plans');
const db = require('../config/database');
const users = require('../controllers/users');
router.get('/health', async (req, res) => {
  await db.read(c => c.execute('SELECT 1 FROM DUAL'));
  res.json({ status: 'ok', database: 'connected' });
});
router.get('/cities', catalog.cities);
router.get('/cities/:id', catalog.city);
router.get('/users', users.list);
router.post('/users', users.create);
router.get('/users/:userId', users.detail);
router.put('/users/:userId', users.update);
for (const resource of ['pois', 'places', 'restaurants', 'activities', 'events']) {
  router.get(`/${resource}`, catalog.list(resource));
  router.get(`/${resource}/:id`, catalog.detail(resource));
}
router.get('/pois/:id/reviews', reviews.list);
router.post('/pois/:id/reviews', reviews.create);
router.put('/reviews/:id', reviews.update);
router.delete('/reviews/:id', reviews.remove);
router.get('/users/:userId/saved-pois', plans.saved);
router.post('/users/:userId/saved-pois/:poiId', plans.save);
router.delete('/users/:userId/saved-pois/:poiId', plans.unsave);
for (const resource of ['trips', 'itineraries']) {
  const param = resource === 'trips' ? 'tripNo' : 'itineraryNo';
  const collection = `/users/:userId/${resource}`;
  const item = `${collection}/:${param}`;
  router.get(collection, plans.list(resource));
  router.post(collection, plans.create(resource));
  router.get(item, plans.detail(resource));
  router.put(item, plans.update(resource));
  router.delete(item, plans.remove(resource));
}
router.post('/users/:userId/itineraries/:itineraryNo/pois/:poiId', plans.addPoi);
router.delete('/users/:userId/itineraries/:itineraryNo/pois/:poiId', plans.removePoi);
module.exports = router;
