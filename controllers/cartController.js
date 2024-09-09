const pool = require('../db-config');

// Get Cart Items for a specific user
exports.getCartItems = async (req, res) => {
    const userId = req.params.userId;
    try {
        // Find the cart for the user
        const cartResult = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);

        // If no cart is found for the user
        if (cartResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cart not found for this user' });
        }

        const cartId = cartResult.rows[0].id;

        // Get the items from the cart using the cart_id
        const itemsResult = await pool.query(
            'SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1',
            [cartId]
        );

        res.json(itemsResult.rows);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Add Item to Cart for a specific user
exports.addItemToCart = async (req, res) => {
    const userId = req.params.userId;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
        return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    try {
        // Check if the user has an existing cart
        let cartResult = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);

        let cartId;

        if (cartResult.rows.length === 0) {
            // If the cart does not exist, create a new one
            const newCart = await pool.query(
                'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
                [userId]
            );
            cartId = newCart.rows[0].id;
        } else {
            cartId = cartResult.rows[0].id;
        }

        // Check if the item already exists in the cart
        const itemResult = await pool.query(
            'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
            [cartId, product_id]
        );

        if (itemResult.rows.length > 0) {
            // Item exists, so update the quantity
            await pool.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE cart_id = $2 AND product_id = $3',
                [quantity, cartId, product_id]
            );
        } else {
            // Item does not exist, so insert a new item
            await pool.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
                [cartId, product_id, quantity]
            );
        }

        res.status(200).json({ message: 'Item added to cart successfully' });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteItemFromCart = async (req, res) => {
    const userId = req.params.userId;
    const { product_id, quantity } = req.body;

    console.log(`Deleting product ${product_id} with quantity ${quantity} from user ${userId}`);

    if (!product_id || quantity === undefined) {
        return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    try {
        // Check if the user has an existing cart
        const cartResult = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);

        if (cartResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cart not found for this user' });
        }

        const cartId = cartResult.rows[0].id;

        // Check if the item exists in the cart
        const itemResult = await pool.query(
            'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
            [cartId, product_id]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        const currentQuantity = itemResult.rows[0].quantity;

        console.log(`Current quantity of product ${product_id} in cart: ${currentQuantity}`);

        if (currentQuantity <= quantity) {
            // Remove the item if the quantity to delete is greater than or equal to the current quantity
            await pool.query(
                'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
                [cartId, product_id]
            );
            console.log(`Deleted all ${product_id} from cart`);
        } else {
            // Otherwise, just update the quantity
            await pool.query(
                'UPDATE cart_items SET quantity = quantity - $1 WHERE cart_id = $2 AND product_id = $3',
                [quantity, cartId, product_id]
            );
            console.log(`Updated quantity of product ${product_id} to ${currentQuantity - quantity}`);
        }

        res.status(200).json({ message: 'Item quantity updated successfully' });
    } catch (error) {
        console.error('Error deleting item from cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Checkout Cart
exports.checkoutCart = async (req, res) => {
    const cartId = parseInt(req.params.cartId);
    const { paymentDetails } = req.body; // paymentDetails should include amount and paymentMethod

    if (!paymentDetails || !paymentDetails.amount || !paymentDetails.paymentMethod) {
        return res.status(400).json({ error: 'Payment details are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Validate cart existence
        const cartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
        if (cartResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Get cart items with price
        const itemsResult = await client.query(`
            SELECT ci.product_id, ci.quantity, p.price as price_at_purchase
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = $1
        `, [cartId]);

        if (itemsResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Cart is empty' });
        }

        // Calculate total amount
        const totalAmount = itemsResult.rows.reduce((sum, item) => {
            return sum + (item.quantity * item.price_at_purchase);
        }, 0);

        // Create order
        const newOrderResult = await client.query(
            'INSERT INTO orders (user_id, status, total_amount, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
            [cartResult.rows[0].user_id, 'pending', totalAmount]
        );
        const orderId = newOrderResult.rows[0].id;

        // Record payment details
        await client.query(
            'INSERT INTO payments (order_id, amount, payment_method, payment_status, payment_date) VALUES ($1, $2, $3, $4, NOW())',
            [orderId, paymentDetails.amount, paymentDetails.paymentMethod, 'success']
        );

        // Create order items
        for (const item of itemsResult.rows) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
                [orderId, item.product_id, item.quantity, item.price_at_purchase]
            );
        }

        // Optionally clear the cart
        await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

        // Commit transaction
        await client.query('COMMIT');
        res.status(201).json({ message: 'Checkout successful', orderId });
    } catch (error) {
        console.error('Error during checkout:', error);
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};



