const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/product/register', async (req, res) => {
    try{
        const {productName, productCode, productQuantity, productPrice} = req.body;

        if (isNaN(productQuantity) || typeof productQuantity !== 'number') {
            return res.status(400).json({ error: 'Quantity should be a number' });
        }

        const checkUserQuery = 'SELECT * FROM products WHERE productCode = ?';
        const [existingUser ] = await db.promise().execute(checkUserQuery, [productCode]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Product code already exists' });
        }

        const insertUserQuery = 'INSERT INTO products (productName, productCode, productQuantity, productPrice, pcreation_date) VALUES (?, ?, ?, ?, DATE_FORMAT(NOW(), "%m-%d-%Y %h:%i %p"))';
        await db.promise().execute(insertUserQuery, [productName, productCode, productQuantity, productPrice]);

        res.status(201).json({ message: 'Product registered successfully' });
    } catch (error) {
        console.error('Error registering product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/products', authenticateToken, async (req, res) => {
    try {

        db.query('SELECT product_id, productName, productCode, productQuantity, productPrice, pcreation_date FROM products ORDER BY pcreation_date DESC', (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/product/:id', authenticateToken, async (req, res) => {
    
    let product_id = req.params.id;

    if (!product_id) {
        return req.status(400).send({ error: true, message: 'Please provide product_id' });  
    }

    try {

        db.query('SELECT product_id, productName, productCode, productQuantity, productPrice, pcreation_date FROM products WHERE product_id = ?', product_id, (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/product/:id', authenticateToken, async (req, res) => {
    let product_id = req.params.id;
    const {productName, productCode, productQuantity, productPrice} = req.body;

    if (!product_id || !productName || !productCode || !productQuantity || !productPrice) {
        return res.status(400).send({ error: user, message: 'Please provide productName, productCode, productQuantity and productPrice' });  
    }

    if (isNaN(productQuantity) || typeof productQuantity !== 'number') {
            return res.status(400).json({ error: 'Quantity should be a number' });
        }

    try {

        const checkUserQuery = 'SELECT * FROM products WHERE productCode = ? AND product_id != ?';
        const [existingUser ] = await db.promise().execute(checkUserQuery, [productCode, product_id]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Product code already exists' });
        }

        const updateUserQuery = 'UPDATE products SET productName = ?, productCode = ?, productQuantity = ?, productPrice = ?, pcreation_date = DATE_FORMAT(NOW(), "%m-%d-%Y %h:%i %p") WHERE product_id = ?';
        await db.promise().execute(updateUserQuery, [productName, productCode, productQuantity, productPrice, product_id]);

        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/product/:id', authenticateToken, async (req, res) => {
    
    let product_id = req.params.id;

    if (!product_id) {
        return res.status(400).send({ error: true, message: 'Please provide product_id' });  
    }

    try {

        db.query('DELETE FROM products WHERE product_id = ?', product_id, (err, result, fields) => {

            if (err) {
                console.error('Error deleting items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;