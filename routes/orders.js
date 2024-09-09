const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const passport = require('passport');

// Get all orders for the authenticated user
router.get('/', passport.authenticate('local', { session: true }), orderController.getAllOrders);

// Get a specific order by ID
router.get('/:orderId', passport.authenticate('local', { session: true }), orderController.getOrderById);

module.exports = router;
