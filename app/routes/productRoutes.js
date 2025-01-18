const express = require('express');
const router = express.Router();
const connection = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/product/register', async (req, res) => {
    try {
        const db = await connection();
        const { productName, productCode, productType, productQuantity, productPrice } = req.body;
    
        const quantity = Number(productQuantity);
        const price = Number(productPrice);
        if (isNaN(quantity) || productQuantity === '' || productQuantity === null || quantity < 0) {
            return res.status(400).json({ error: 'Product quantity must be a number greaterthan or equal to zero.' });
        }
        if (isNaN(price) || productPrice === '' || productPrice === null || price < 0) {
            return res.status(400).json({ error: 'Product price must be a number greaterthan or equal to zero.' });
        }

        const checkUserQuery = 'SELECT * FROM products WHERE productCode = ?';
        const [existingUser ] = await db.execute(checkUserQuery, [productCode]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Product code already exists' });
        }

        const insertUserQuery =
          'INSERT INTO products (productName, productCode, productType, productQuantity, productPrice, timestamp_add, timestamp_update) VALUES (?, ?, ?, ?, ?, NOW(), NOW())';
        await db.execute(insertUserQuery, [productName, productCode, productType, productQuantity, productPrice]);

        res.status(201).json({ message: 'Product registered successfully' });
    } catch (error) {
        console.error('Error registering product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/products", authenticateToken, async (req, res) => {
    try {
        const db = await connection();
        const [results] = await db.execute(
            "SELECT product_id, productName, productCode, productType, productQuantity, productPrice, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') as timestamp_update FROM products ORDER BY timestamp_update DESC"
        );
        res.status(200).json(results);
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/product/:id", authenticateToken, async (req, res) => {
    let product_id = req.params.id;

    if (!product_id) {
        return req
        .status(400)
        .send({ error: true, message: "Please provide product_id" });
    }

    try {
        const db = await connection();
        const [results] = await db.execute(
            "SELECT product_id, productName, productCode, productType, productQuantity, productPrice, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') as timestamp_update FROM products WHERE product_id = ?",
            [product_id]
        );
        res.status(200).json(results);
    } catch (error) {
        console.error("Error loading product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put('/product/:id', authenticateToken, async (req, res) => {
    let product_id = req.params.id;
    const {productName, productCode, productType, productQuantity, productPrice} = req.body;

    if (!product_id || !productName || !productCode || productQuantity === undefined || productPrice === undefined) {
        return res.status(400).send({ error: true, message: 'Please provide productName, productCode, productQuantity, and productPrice' });
    }

    const quantity = Number(productQuantity);
    const price = Number(productPrice);
    if (isNaN(quantity) || productQuantity === '' || productQuantity === null || quantity < 0) {
        return res.status(400).json({ error: 'Product quantity must be a number greaterthan or equal to zero.' });
    }
    if (isNaN(price) || productPrice === '' || productPrice === null || price < 0) {
        return res.status(400).json({ error: 'Product price must be a number greaterthan or equal to zero.' });
    }

    try {
        const db = await connection();
        const checkUserQuery = 'SELECT * FROM products WHERE productCode = ? AND product_id != ?';
        const [existingUser ] = await db.execute(checkUserQuery, [productCode, product_id]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Product code already exists' });
        }

        const updateUserQuery = 'UPDATE products SET productName = ?, productCode = ?, productType = ?, productQuantity = ?, productPrice = ?, timestamp_update = NOW() WHERE product_id = ?';
        await db.execute(updateUserQuery, [productName, productCode, productType, productQuantity, productPrice, product_id]);

        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete("/product/:id", authenticateToken, async (req, res) => {
    let product_id = req.params.id;

    if (!product_id) {
        return res
        .status(400)
        .send({ error: true, message: "Please provide product_id" });
    }

    try {
        const db = await connection();
        await db.execute("DELETE FROM products WHERE product_id = ?", [product_id]);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;