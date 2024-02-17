const express = require('express');
const router = express.Router();
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
const db = require('../database/db.js');
// const secretKey = require('../secretkey/secretkey.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/product/register', async (req, res) => {
    try{
            
        const {productName, productCode, productQuantity, productPrice} = req.body;

        const insertUserQuery = 'INSERT INTO products (productName, productCode, productQuantity, productPrice) VALUES (?, ?, ?, ?)';
        await db.promise().execute(insertUserQuery, [productName, productCode, productQuantity, productPrice]);

        res.status(201).json({ message: 'Product registered successfully' });
    } catch (error) {
        
        console.error('Error registering product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/products', authenticateToken, async (req, res) => {
    try {

        db.query('SELECT product_id, productName, productCode, productQuantity, productPrice FROM products', (err, result) => {

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

        db.query('SELECT productName, productCode, productQuantity, productPrice FROM products WHERE product_id = ?', product_id, (err, result) => {

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
        return req.status(400).send({ error: user, message: 'Please provide productName, productCode, productQuantity and productPrice' });  
    }

    try {

        db.query('UPDATE products SET productName = ?, productCode = ?, productQuantity = ?, productPrice = ? WHERE product_id = ?', [productName, productCode, productQuantity, productPrice, product_id], (err, result, fields) => {

            if (err) {
                console.error('Error updating items:', err);
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