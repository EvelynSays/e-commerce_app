const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST route for user registration
router.post('/register', userController.registerUser);

// GET route for retrieving user by ID
router.get('/:id', userController.getUserById); 

// PUT route for updating user by ID
router.put('/:id', userController.updateUser);
module.exports = router;

// DELETE route for deleting user by ID
router.delete('/:id', userController.deleteUser);
