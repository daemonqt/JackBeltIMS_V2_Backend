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
            GROUP BY p.product_id, p.productName
            ORDER BY total_sales DESC;
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

router.get('/sales-by-month', authenticateToken, async (req, res) => {
    try {
        const salesByMonthQuery = `
            SELECT 
                DATE_FORMAT(STR_TO_DATE(timestamp_update, '%m-%d-%Y %h:%i %p'), '%Y-%M') AS month,
                SUM(priceInTotal) AS sales_amount,
                SUM(orderQuantity) AS total_sales
            FROM orders
            WHERE orderStatus != 'PENDING'
            GROUP BY month
            ORDER BY STR_TO_DATE(CONCAT('01-', SUBSTRING(month, 6)), '%d-%M-%Y');
        `;
        db.query(salesByMonthQuery, (err, result) => {
            if (err) {
                console.error('Error fetching sales by products:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });
    } catch (error) {
        console.error('Error fetching sales by month:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/orders-by-month', authenticateToken, async (req, res) => {
    try {
        const ordersByMonthQuery = `
            SELECT p.productName, 
            DATE_FORMAT(STR_TO_DATE(timestamp_update, '%m-%d-%Y %h:%i %p'), '%M') AS orderMonth, 
            COUNT(o.order_id) AS orderCount
            FROM products p
            LEFT JOIN orders o ON p.product_id = o.product_id
            GROUP BY p.productName, orderMonth
            ORDER BY orderCount DESC;
        `;
        db.query(ordersByMonthQuery, (err, result) => {
            if (err) {
                console.error('Error fetching orders by products:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });
    } catch (error) {
        console.error('Error fetching orders by month:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
