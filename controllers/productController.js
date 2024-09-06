const pool = require('../db-config');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error retrieving product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add a new product
exports.addProduct = async (req, res) => {
    const { name, description, price, stock, category_id, created_at } = req.body;

    if (!name || !price || !stock) {
        return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price, stock, category_id, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description || null, price, stock, category_id || null, created_at || new Date()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update product by ID
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category_id } = req.body;

    try {
        const result = await pool.query(
            'UPDATE products SET name = $1, description = $2, price = $3, category_id = $4 WHERE id = $5 RETURNING *',
            [name, description, price, category_id, id]
        );

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete product by ID
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length > 0) {
            res.status(200).json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};