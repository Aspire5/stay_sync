const express = require('express');
const router = express.Router();

const { getDefaultProperty } = require('../controllers/property.controller');
const { getCalendar } = require('../controllers/calendar.controller');
const {
  createBooking,
  blockDates,
  unblockDates,
  cancelReservation,
} = require('../controllers/reservation.controller');
const { setPriceOverride } = require('../controllers/pricing.controller');
const { importFeed } = require('../controllers/channel.controller');

// Property routes
router.get('/properties/default', getDefaultProperty);

// Calendar routes
router.get('/calendar', getCalendar);

// Reservation routes
router.post('/reservations/booking', createBooking);
router.post('/reservations/block', blockDates);
router.post('/reservations/unblock', unblockDates);
router.delete('/reservations/:id', cancelReservation);

// Pricing routes
router.post('/pricing/override', setPriceOverride);

// Channel reconciliation feed route
router.post('/channel/import', importFeed);

module.exports = router;
