const bcrypt = require('bcryptjs');
const pool = require('../db-config'); // Import the database pool

// Handle user registration
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        // Check if the user already exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handle retrieving a user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handle updating user information
exports.updateUser = async (req, res) => {
    const userId = req.params.id;
    const { name, email, password } = req.body;

    if (!name && !email && !password) {
        return res.status(400).json({ error: 'At least one field is required for update' });
    }

    try {
        // Check if the user exists
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build the update query
        const updates = [];
        if (name) updates.push(`name = '${name}'`);
        if (email) updates.push(`email = '${email}'`);
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push(`password = '${hashedPassword}'`);
        }

        const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $1`;

        await pool.query(updateQuery, [userId]);

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handle deleting a user
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        // Check if the user exists
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete the user from the database
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
