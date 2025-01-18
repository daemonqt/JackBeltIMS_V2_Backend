// filepath: /d:/JackBeltIMSv2/backend/routes/chartsData.js
const express = require("express");
const router = express.Router();
const connection = require("../database/db.js");
const authenticateToken = require("../authenticator/authentication.js");

router.get("/seasonality-data", authenticateToken, async (req, res) => {
    try {
        const db = await connection();
        const [results] = await db.execute(`
            SELECT 
                p.productName, 
                MONTH(o.timestamp_update) AS month, 
                SUM(o.orderQuantity) AS totalQuantity
            FROM orders o
            JOIN products p ON o.product_id = p.product_id
            WHERE o.orderStatus != 'PENDING'
            GROUP BY p.productName, month
            ORDER BY p.productName, month;
        `);
        const data = results.reduce((acc, row) => {
            const { productName, month, totalQuantity } = row;
            if (!acc[productName]) {
                acc[productName] = Array(12).fill(0);
            }
            acc[productName][month - 1] = totalQuantity;
            return acc;
        }, {});

        const seriesData = Object.keys(data).map((productName) => ({
            name: productName,
            data: data[productName],
        }));

        res.status(200).json(seriesData);
    } catch (error) {
        console.error("Error fetching seasonality data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/daily-sales", authenticateToken, async (req, res) => {
    try {
        const db = await connection();
        const [results] = await db.execute(`
            SELECT 
                DATE_FORMAT(timestamp_update, '%m-%d-%Y') AS date,
                SUM(orderQuantity) AS totalQuantity
            FROM orders
            WHERE orderStatus != 'PENDING'
                AND YEAR(timestamp_update) = YEAR(CURDATE())
                AND MONTH(timestamp_update) = MONTH(CURDATE())
            GROUP BY date
            ORDER BY date;
        `);

        const data = results.map((row) => ({
            date: row.date,
            totalQuantity: row.totalQuantity,
        }));

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching daily sales data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/monthly-sales", authenticateToken, async (req, res) => {
    try {
        const db = await connection();
        const [results] = await db.execute(`
            SELECT 
                DATE_FORMAT(timestamp_update, '%Y-%m') AS month,
                SUM(orderQuantity) AS totalQuantity
            FROM orders
            WHERE orderStatus != 'PENDING'
                AND YEAR(timestamp_update) = YEAR(CURDATE()) 
            GROUP BY month
            ORDER BY month;
        `);

        const data = results.map((row) => ({
            month: row.month,
            totalQuantity: row.totalQuantity,
        }));

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching monthly sales data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/yearly-sales", authenticateToken, async (req, res) => {
    try {
        const db = await connection();
        const [results] = await db.execute(`
            SELECT 
                YEAR(timestamp_update) AS year,
                SUM(orderQuantity) AS totalQuantity
            FROM orders
            WHERE orderStatus != 'PENDING'
                AND YEAR(timestamp_update) BETWEEN YEAR(CURDATE()) - 4 AND YEAR(CURDATE())
            GROUP BY year
            ORDER BY year;
        `);

        const data = results.map((row) => ({
            year: row.year,
            totalQuantity: row.totalQuantity,
        }));

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching yearly sales data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/product-revenue", authenticateToken, async (req, res) => {
    try {
        const db = await connection();
        const [results] = await db.execute(`
            SELECT 
                p.productName,
                COALESCE(SUM(o.orderQuantity), 0) * p.productPrice AS totalRevenue
            FROM orders o
            JOIN products p ON o.product_id = p.product_id
            WHERE o.orderStatus != 'PENDING'
            GROUP BY p.productName, p.productPrice
            ORDER BY totalRevenue DESC;
        `);

        const data = results.map((row) => ({
            productName: row.productName,
            totalRevenue: row.totalRevenue,
        }));

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching product revenue data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
