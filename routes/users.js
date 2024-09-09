const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST route for user registration
router.post('/register', userController.registerUser);

// GET route for retrieving user by ID
router.get('/:id', userController.getUserById); 

// Update user route
router.put('/:id', passport.authenticate('local', { session: true }), updateUser);

// DELETE route for deleting user by ID
router.delete('/:id', userController.deleteUser);
