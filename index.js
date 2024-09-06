const express = require('express');
const passport = require('passport');
const app = express();
const port = 3000; // or any port you choose

// Import the database pool
const pool = require('./db-config');

// Import Passport configuration
require('./config/passport-config')(passport);


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

// Import routes
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Example route to test database connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Test query
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).send('Database query error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
