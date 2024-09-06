const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Define routes for products
router.get('/', productController.getAllProducts); // Handle GET request for all products
router.get('/:id', productController.getProductById); // Handle GET request for a specific product by ID
router.post('/', productController.addProduct); // Handle POST request to add a new product
router.put('/:id', productController.updateProduct); // Handle PUT request to update a product
router.delete('/:id', productController.deleteProduct); // Handle DELETE request to remove a product

module.exports = router;