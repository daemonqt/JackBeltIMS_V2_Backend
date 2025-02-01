// filepath: /d:/JackBeltIMSv2/backend/routes/chartsData.js
const express = require("express");
const router = express.Router();
const connection = require("../database/db.js");
const authenticateToken = require("../authenticator/authentication.js");

router.get("/seasonality-data", authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT 
                p.productName,
                p.productVariant,
                MONTH(od.timestamp_create) AS month, 
                SUM(od.orderQuantity) AS totalQuantity
            FROM 
                order_details od
            JOIN 
                products p ON od.product_id = p.product_id
            GROUP BY 
                p.productVariant, month
            ORDER BY 
                p.productName, month;
        `);
        const data = results.reduce((acc, row) => {
            const { productName, productVariant, month, totalQuantity } = row;
            if (!acc[productVariant]) {
                acc[productVariant] = Array(12).fill(0);
            }
            acc[productVariant][month - 1] = totalQuantity;
            return acc;
        }, {});

        const seriesData = Object.keys(data).map((productVariant) => ({
            name: productVariant,
            data: data[productVariant],
        }));

        res.status(200).json(seriesData);
    } catch (error) {
        console.error("Error fetching seasonality data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get("/daily-sales", authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT 
                DATE(timestamp_create) AS date,
                SUM(orderQuantity) AS totalQuantity
            FROM order_details
            WHERE 
                timestamp_create >= DATE(NOW() - INTERVAL 6 DAY)
                AND timestamp_create <= DATE(NOW()) 
            GROUP BY DATE(timestamp_create)
            ORDER BY DATE(timestamp_create);
        `);

        const data = results.map((row) => ({
            date: row.date,
            totalQuantity: row.totalQuantity,
        }));

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching daily sales data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get("/monthly-sales", authenticateToken, async (req, res) => {
    let db;
    try {
        const db = await connection();
        const [results] = await db.execute(`
            SELECT 
                DATE_FORMAT(timestamp_create, '%Y/%m') AS month,
                SUM(orderQuantity) AS totalQuantity
            FROM order_details
            WHERE
                YEAR(timestamp_create) = YEAR(CURDATE()) 
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
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get("/yearly-sales", authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT 
                YEAR(timestamp_create) AS year,
                SUM(orderQuantity) AS totalQuantity
            FROM order_details
            WHERE
				YEAR(timestamp_create) BETWEEN YEAR(CURDATE()) - 4 AND YEAR(CURDATE())
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
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get("/product-revenue", authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
            SELECT 
                p.productName,
                p.productVariant,
                COALESCE(SUM(od.orderQuantity), 0) * p.productPrice AS totalRevenue
            FROM 
                order_details od
            JOIN 
                products p ON od.product_id = p.product_id
            GROUP BY 
                p.productVariant, p.productPrice
            ORDER BY 
                totalRevenue DESC;
        `);

        const data = results.map((row) => ({
            productVariant: row.productVariant,
            totalRevenue: row.totalRevenue,
        }));

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching product revenue data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (db) {
            db.release();
        }
    }
});

module.exports = router;
