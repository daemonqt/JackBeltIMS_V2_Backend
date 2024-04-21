const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.get('/sales', authenticateToken, async (req, res) => {
    try {
        const totalSalesQuery = `
            SELECT SUM(o.orderQuantity * p.productPrice) AS total_sales 
            FROM orders o 
            JOIN products p ON o.product_id = p.product_id
            WHERE o.orderStatus != 'PENDING'
        `;
        db.query(totalSalesQuery, (err, result) => {
            if (err) {
                console.error('Error fetching total sales:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const totalSales = result[0].total_sales || 0;
                res.status(200).json({ totalSales });
            }
        });
    } catch (error) {
        console.error('Error loading total sales:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/sales-by-products', authenticateToken, async (req, res) => {
    try {
        const salesByProductsQuery = `
            SELECT p.product_id, p.productName, SUM(o.orderQuantity * p.productPrice) AS total_sales
            FROM orders o
            JOIN products p ON o.product_id = p.product_id
            WHERE o.orderStatus != 'PENDING'
            GROUP BY p.product_id, p.productName;
        `;
        db.query(salesByProductsQuery, (err, result) => {
            if (err) {
                console.error('Error fetching sales by products:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });
    } catch (error) {
        console.error('Error fetching sales by products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
