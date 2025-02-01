const express = require('express');
const router = express.Router();
const connection = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.get('/users/count', authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT COUNT(*) AS userCount 
            FROM users
        `);
        const userCount = results[0].userCount;
        res.status(200).json({ userCount });
    } catch (error) {
        console.error('Error loading user count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get('/products/count', authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT COUNT(*) AS productCount 
            FROM products
        `);
        const productCount = results[0].productCount;
        res.status(200).json({ productCount });
    } catch (error) {
        console.error('Error loading product count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (db) {
            db.release();
        }
    }
});

// router.get('/customers/count', authenticateToken, async (req, res) => {
//     try {
//         const db = await connection();
//         const [results] = await db.execute(`
//             SELECT COUNT(*) AS customerCount 
//             FROM customers
//         `);
//         const customerCount = results[0].customerCount;
//         res.status(200).json({ customerCount });
//     } catch (error) {
//         console.error('Error loading customer count:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.get('/suppliers/count', authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT COUNT(*) AS supplierCount 
            FROM suppliers
        `);
        const supplierCount = results[0].supplierCount;
        res.status(200).json({ supplierCount });
    } catch (error) {
        console.error('Error loading supplier count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get('/orders/count', authenticateToken, async (req, res) => {
    let db;
    try {
        const db = await connection();
        const [results] = await db.execute(`
            SELECT COUNT(*) AS orderCount 
            FROM orders
        `);
        const orderCount = results[0].orderCount;
        res.status(200).json({ orderCount });
    } catch (error) {
        console.error('Error loading order count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get('/purchaseorders/count', authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT COUNT(*) AS purchaseorderCount 
            FROM purchaseorders
        `);
        const purchaseorderCount = results[0].purchaseorderCount;
        res.status(200).json({ purchaseorderCount });
    } catch (error) {
        console.error('Error loading purchaseorder count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get('/fresh-product/count', authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT COUNT(*) AS freshproductsCount 
            FROM freshproducts
        `);
        const freshproductsCount = results[0].freshproductsCount;
        res.status(200).json({ freshproductsCount });
    } catch (error) {
        console.error('Error loading product count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (db) {
            db.release();
        }
    }
});

module.exports = router;