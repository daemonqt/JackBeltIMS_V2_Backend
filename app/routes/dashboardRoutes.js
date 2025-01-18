const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.get('/users/count', authenticateToken, async (req, res) => {
    try {
        db.execute('SELECT COUNT(*) AS userCount FROM users', (err, result) => {
            if (err) {
                console.error('Error fetching user count:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const userCount = result[0].userCount;
                res.status(200).json({ userCount });
            }
        });
    } catch (error) {
        console.error('Error loading user count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/products/count', authenticateToken, async (req, res) => {
    try {
        db.execute('SELECT COUNT(*) AS productCount FROM products', (err, result) => {
            if (err) {
                console.error('Error fetching product count:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const productCount = result[0].productCount;
                res.status(200).json({ productCount });
            }
        });
    } catch (error) {
        console.error('Error loading product count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/customers/count', authenticateToken, async (req, res) => {
    try {
        db.execute('SELECT COUNT(*) AS customerCount FROM customers', (err, result) => {
            if (err) {
                console.error('Error fetching customer count:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const customerCount = result[0].customerCount;
                res.status(200).json({ customerCount });
            }
        });
    } catch (error) {
        console.error('Error loading customer count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/suppliers/count', authenticateToken, async (req, res) => {
    try {
        db.execute('SELECT COUNT(*) AS supplierCount FROM suppliers', (err, result) => {
            if (err) {
                console.error('Error fetching supplier count:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const supplierCount = result[0].supplierCount;
                res.status(200).json({ supplierCount });
            }
        });
    } catch (error) {
        console.error('Error loading supplier count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/orders/count', authenticateToken, async (req, res) => {
    try {
        db.execute('SELECT COUNT(*) AS orderCount FROM orders', (err, result) => {
            if (err) {
                console.error('Error fetching order count:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const orderCount = result[0].orderCount;
                res.status(200).json({ orderCount });
            }
        });
    } catch (error) {
        console.error('Error loading order count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/purchaseorders/count', authenticateToken, async (req, res) => {
    try {
        db.execute('SELECT COUNT(*) AS purchaseorderCount FROM purchaseorders', (err, result) => {
            if (err) {
                console.error('Error fetching purchaseorder count:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const purchaseorderCount = result[0].purchaseorderCount;
                res.status(200).json({ purchaseorderCount });
            }
        });
    } catch (error) {
        console.error('Error loading purchaseorder count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/fresh-product/count', authenticateToken, async (req, res) => {
    try {
        db.execute('SELECT COUNT(*) AS freshproductsCount FROM freshproducts', (err, result) => {
            if (err) {
                console.error('Error fetching product count:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const freshproductsCount = result[0].freshproductsCount;
                res.status(200).json({ freshproductsCount });
            }
        });
    } catch (error) {
        console.error('Error loading product count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;