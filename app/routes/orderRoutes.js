const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/order/register', async (req, res) => {
    try {
        const { customer_id, product_id, orderQuantity, orderStatus, user_id } = req.body;

        // Calculate priceInTotal
        const [product] = await db.promise().query('SELECT productPrice FROM products WHERE product_id = ?', [product_id]);
        const productPrice = product[0].productPrice;
        const priceInTotal = orderQuantity * productPrice;

        const insertOrderQuery =
          'INSERT INTO orders (customer_id, product_id, orderQuantity, orderStatus, user_id, timestamp_add, timestamp_update, priceInTotal) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)';
        await db.promise().execute(insertOrderQuery, [customer_id, product_id, orderQuantity, orderStatus, user_id, priceInTotal]);

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

        db.query(
            "SELECT order_id, customer_id, product_id, orderQuantity, priceInTotal, orderStatus, user_id, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') as timestamp_update FROM orders ORDER BY timestamp_update DESC", 
            (err, result) => {

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

        db.query(
            "SELECT order_id, customer_id, product_id, orderQuantity, priceInTotal, orderStatus, user_id, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') as timestamp_update FROM orders WHERE order_id = ?", 
            order_id, 
            (err, result) => {

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

        db.query('UPDATE orders SET customer_id = ?, product_id = ?, orderQuantity = ?, orderStatus = ?, user_id = ?, timestamp_update = NOW() WHERE order_id = ?', [customer_id, product_id, orderQuantity, orderStatus, user_id, order_id], async (err, result, fields) => {

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

// router.put('/order/:id', authenticateToken, async (req, res) => {
//     const order_id = req.params.id;
//     const { customer_id, product_id: newProductId, orderQuantity: newOrderQuantity, orderStatus, user_id } = req.body;

//     if (!order_id || !customer_id || !newProductId || !newOrderQuantity || !orderStatus || !user_id) {
//         return res.status(400).json({
//             error: true,
//             message: 'Please provide customer_id, product_id, orderQuantity, orderStatus, and user_id',
//         });
//     }

//     const connection = await db.promise().getConnection();

//     try {
//         // Start transaction
//         await connection.beginTransaction();

//         // Step 1: Retrieve the old product_id and orderQuantity
//         const [oldOrder] = await connection.query(
//             `SELECT product_id AS oldProductId, orderQuantity AS oldOrderQuantity FROM orders WHERE order_id = ?`,
//             [order_id]
//         );

//         if (oldOrder.length === 0) {
//             throw new Error('Order not found');
//         }

//         const { oldProductId, oldOrderQuantity } = oldOrder[0];

//         // Step 2: Restore old product quantity only if the product_id has changed
//         if (oldProductId !== newProductId) {
//             await connection.query(
//                 `UPDATE products SET productQuantity = productQuantity + ? WHERE product_id = ?`,
//                 [oldOrderQuantity, oldProductId]
//             );

//             // Deduct the new order quantity from the new product
//             await connection.query(
//                 `UPDATE products SET productQuantity = productQuantity - ? WHERE product_id = ?`,
//                 [newOrderQuantity, newProductId]
//             );
//         } else {
//             // Update the product quantity for the same product
//             const quantityDifference = newOrderQuantity - oldOrderQuantity;
//             await connection.query(
//                 `UPDATE products SET productQuantity = productQuantity - ? WHERE product_id = ?`,
//                 [quantityDifference, oldProductId]
//             );
//         }

//         // Step 3: Update the order details
//         await connection.query(
//             `UPDATE orders SET customer_id = ?, product_id = ?, orderQuantity = ?, orderStatus = ?, user_id = ?, timestamp_update = NOW() WHERE order_id = ?`,
//             [customer_id, newProductId, newOrderQuantity, orderStatus, user_id, order_id]
//         );

//         // Step 4: Recalculate and update the price
//         const [newProduct] = await connection.query(
//             `SELECT productPrice FROM products WHERE product_id = ?`,
//             [newProductId]
//         );

//         if (newProduct.length === 0) {
//             throw new Error('New product not found');
//         }

//         const newPriceInTotal = newOrderQuantity * newProduct[0].productPrice;

//         await connection.query(
//             `UPDATE orders SET priceInTotal = ? WHERE order_id = ?`,
//             [newPriceInTotal, order_id]
//         );

//         // Commit the transaction
//         await connection.commit();
//         res.status(200).json({ message: 'Order updated successfully' });
//     } catch (error) {
//         // Rollback the transaction on error
//         await connection.rollback();
//         console.error('Error updating order:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     } finally {
//         // Release the connection
//         connection.release();
//     }
// });

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