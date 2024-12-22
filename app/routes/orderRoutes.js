const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/order/register', async (req, res) => {
    try {

        const { customer_id, product_id, orderQuantity, orderStatus, user_id } = req.body;

        const insertUserQuery = 'INSERT INTO orders (customer_id, product_id, orderQuantity, orderStatus, user_id, orderDatenTime) VALUES (?, ?, ?, ?, ?, DATE_FORMAT(NOW(), "%m-%d-%Y %h:%i %p"))';
        const [insertOrderResult] = await db.promise().execute(insertUserQuery, [customer_id, product_id, orderQuantity, orderStatus, user_id]);
        const order_id = insertOrderResult.insertId;

        const updatePriceQuery = 'UPDATE orders SET priceInTotal = orderQuantity * (SELECT productPrice FROM products WHERE product_id = ?) WHERE order_id = ?';
        await db.promise().execute(updatePriceQuery, [product_id, order_id]);

        const updateQuantityQuery = 'UPDATE products SET productQuantity = productQuantity - ? WHERE product_id = ?';
        await db.promise().execute(updateQuantityQuery, [orderQuantity, product_id]);

        res.status(201).json({ message: 'Order registered successfully, updated products' });
    } catch (error) {

        console.error('Error registering order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/orders', authenticateToken, async (req, res) => {
    try {

        db.query('SELECT order_id, customer_id, product_id, orderQuantity, priceInTotal, orderStatus, user_id, orderDatenTime FROM orders ORDER BY orderDatenTime DESC', (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/order/:id', authenticateToken, async (req, res) => {
    
    let order_id = req.params.id;

    if (!order_id) {
        return req.status(400).send({ error: true, message: 'Please provide order_id' });  
    }

    try {

        db.query('SELECT order_id, customer_id, product_id, orderQuantity, priceInTotal, orderStatus, user_id, orderDatenTime FROM orders WHERE order_id = ?', order_id, (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/order/:id', authenticateToken, async (req, res) => {

    let order_id = req.params.id;

    const {customer_id, product_id, orderQuantity, orderStatus, user_id} = req.body;

    if (!order_id || !customer_id || !product_id || !orderQuantity || !orderStatus || !user_id) {
        return req.status(400).send({ error: user, message: 'Please provide customer_id, product_id, orderQuantity, orderStatus and user_id' });  
    }

    try {

        db.query('UPDATE orders SET customer_id = ?, product_id = ?, orderQuantity = ?, orderStatus = ?, user_id = ? WHERE order_id = ?', [customer_id, product_id, orderQuantity, orderStatus, user_id, order_id], async (err, result, fields) => {

            if (err) {
                console.error('Error updating items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                
                const updatePriceQuery = 'UPDATE orders SET priceInTotal = orderQuantity * (SELECT productPrice FROM products WHERE product_id = ?) WHERE order_id = ?';
                await db.promise().execute(updatePriceQuery, [product_id, order_id]);
                res.status(200).json({ message: 'Order updated successfully', result });
            }
        });

    } catch (error) {

        console.error('Error loading order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
});

router.delete('/order/:id', authenticateToken, async (req, res) => {
    
    let order_id = req.params.id;

    if (!order_id) {
        return res.status(400).send({ error: true, message: 'Please provide order_id' });  
    }

    try {

        db.query('DELETE FROM orders WHERE order_id = ?', order_id, (err, result, fields) => {

            if (err) {
                console.error('Error deleting items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json({ message: 'Order deleted successfully', result });
            }
        });

    } catch (error) {

        console.error('Error loading order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;