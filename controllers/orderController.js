const pool = require('../db-config');

// Get all orders for the authenticated user
exports.getAllOrders = async (req, res) => {
    const userId = req.user.id; // Assuming user ID is available in req.user from authentication middleware

    try {
        const ordersResult = await pool.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
        
        if (ordersResult.rows.length === 0) {
            return res.status(404).json({ error: 'No orders found for this user' });
        }

        res.json(ordersResult.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a specific order by ID
exports.getOrderById = async (req, res) => {
    const orderId = parseInt(req.params.orderId);

    try {
        // Get the order details
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Get the items for the order
        const orderItemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

        res.json({
            ...order,
            items: orderItemsResult.rows
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
