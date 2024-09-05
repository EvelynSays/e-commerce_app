const express = require('express');
const router = express.Router();
const passport = require('passport');
const { registerUser } = require('../controllers/userController');
const { loginUser } = require('../controllers/authController');

// Handle user registration
router.post('/register', registerUser);

// Handle user login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ error: info.message });
        }

        // Authentication successful
        res.status(200).json({ message: 'Login successful', user });
    })(req, res, next);
});

module.exports = router;
