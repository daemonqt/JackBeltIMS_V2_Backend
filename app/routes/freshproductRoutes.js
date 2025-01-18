const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/fresh-products/register', async (req, res) => {
    try {

        const { product_id, freshproductQuantity, user_id  } = req.body;

        const quantity = Number(freshproductQuantity);
        if (isNaN(quantity) || freshproductQuantity === '' || freshproductQuantity === null || quantity < 0) {
            return res.status(400).json({ error: 'Quantity must be a number greaterthan zero.' });
        }

        const insertUserQuery =
          'INSERT INTO freshproducts (product_id, freshproductQuantity, user_id, timestamp_add, timestamp_update) VALUES (?, ?, ?, NOW(), NOW())';
        await db.execute(insertUserQuery, [product_id, freshproductQuantity, user_id]);

        const updateQuantityQuery = 'UPDATE products SET productQuantity = productQuantity + ? WHERE product_id = ?';
        await db.execute(updateQuantityQuery, [freshproductQuantity, product_id]);

        res.status(201).json({ message: 'Product quantity increased, updated products' });
    } catch (error) {

        console.error('Error adding quantity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/fresh-products', authenticateToken, async (req, res) => {
    try {

        db.query(
            "SELECT freshproduct_id, product_id, freshproductQuantity, user_id, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') as timestamp_update FROM freshproducts ORDER BY timestamp_update DESC", 
            (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading fresh products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/fresh-products/:id', authenticateToken, async (req, res) => {
    
    let freshproduct_id = req.params.id;

    if (!freshproduct_id) {
        return req.status(400).send({ error: true, message: 'Please provide freshproduct_id' });  
    }

    try {

        db.query(
            "SELECT freshproduct_id, product_id, freshproductQuantity, user_id, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') as timestamp_update FROM freshproducts WHERE freshproduct_id = ?", 
            freshproduct_id, 
            (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading fresh products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/fresh-products/:id', authenticateToken, async (req, res) => {

    let freshproduct_id = req.params.id;

    const {product_id, freshproductQuantity, user_id} = req.body;

    if (!freshproduct_id || !product_id || freshproductQuantity === undefined || !user_id) {
        return req.status(400).send({ error: user, message: 'Please provide product_id, freshproductQuantity and user_id' });  
    }

    const quantity = Number(freshproductQuantity);
    if (isNaN(quantity) || freshproductQuantity === '' || freshproductQuantity === null || quantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a number greaterthan zero.' });
    }

    try {

        db.query('UPDATE freshproducts SET product_id = ?, freshproductQuantity = ?, user_id = ?, timestamp_update = NOW() WHERE freshproduct_id = ?', [product_id, freshproductQuantity, user_id, freshproduct_id], async (err, result, fields) => {

            if (err) {
                console.error('Error updating items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading fresh product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
});

router.delete('/fresh-products/:id', authenticateToken, async (req, res) => {
    
    let freshproduct_id = req.params.id;

    if (!freshproduct_id) {
        return res.status(400).send({ error: true, message: 'Please provide freshproduct_id' });  
    }

    try {

        db.query('DELETE FROM freshproducts WHERE freshproduct_id = ?', freshproduct_id, (err, result, fields) => {

            if (err) {
                console.error('Error deleting items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading fresh product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;