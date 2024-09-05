// Import Express
const express = require('express');

// Create an instance of Express
const app = express();

// Define the port
const PORT = process.env.PORT || 3000;

// Create a basic route for the home page
app.get('/', (req, res) => {
  res.send('Welcome to the E-commerce API');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});