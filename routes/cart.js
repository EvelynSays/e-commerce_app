const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Get all items in a specific user's cart
router.get('/:userId', cartController.getCartItems);

// Add a new item to the cart for a specific user
router.post('/:userId/items', cartController.addItemToCart);

// Delete a specific quantity of an item from the cart
router.delete('/:userId/items', cartController.deleteItemFromCart);

// Checkout the cart
router.post('/:cartId/checkout', cartController.checkoutCart);

module.exports = router;
