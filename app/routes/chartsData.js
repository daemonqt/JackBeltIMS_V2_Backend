// filepath: /d:/JackBeltIMSv2/backend/routes/chartsData.js
const express = require("express");
const router = express.Router();
const db = require("../database/db.js");
const authenticateToken = require("../authenticator/authentication.js");

router.get("/seasonality-data", authenticateToken, async (req, res) => {
  try {
    const seasonalityQuery = `
      SELECT p.productName, 
             MONTH(STR_TO_DATE(o.orderDatenTime, '%m-%d-%Y %h:%i %p')) AS month, 
             SUM(o.orderQuantity) AS totalQuantity
      FROM orders o
      JOIN products p ON o.product_id = p.product_id
      WHERE o.orderStatus != 'PENDING'
      GROUP BY p.productName, month
      ORDER BY p.productName, month;
    `;

    db.query(seasonalityQuery, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

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
    });
  } catch (error) {
    console.error("Error fetching seasonality data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/daily-sales", authenticateToken, async (req, res) => {
  try {
    const dailySalesQuery = `
      SELECT 
        DATE_FORMAT(STR_TO_DATE(orderDatenTime, '%m-%d-%Y %h:%i %p'), '%Y-%m-%d') AS date,
        SUM(orderQuantity) AS totalQuantity
      FROM orders
      WHERE orderStatus != 'PENDING'
        AND YEAR(STR_TO_DATE(orderDatenTime, '%m-%d-%Y %h:%i %p')) = YEAR(CURDATE())
        AND MONTH(STR_TO_DATE(orderDatenTime, '%m-%d-%Y %h:%i %p')) = MONTH(CURDATE())
      GROUP BY date
      ORDER BY date;
    `;

    db.query(dailySalesQuery, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

      const data = results.map((row) => ({
        date: row.date,
        totalQuantity: row.totalQuantity,
      }));

      res.status(200).json(data);
    });
  } catch (error) {
    console.error("Error fetching daily sales data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/monthly-sales", authenticateToken, async (req, res) => {
  try {
    const monthlySalesQuery = `
      SELECT 
        DATE_FORMAT(STR_TO_DATE(orderDatenTime, '%m-%d-%Y %h:%i %p'), '%Y-%m') AS month,
        SUM(orderQuantity) AS totalQuantity
      FROM orders
      WHERE orderStatus != 'PENDING'
        AND YEAR(STR_TO_DATE(orderDatenTime, '%m-%d-%Y %h:%i %p')) = YEAR(CURDATE())
      GROUP BY month
      ORDER BY month;
    `;

    db.query(monthlySalesQuery, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

      const data = results.map((row) => ({
        month: row.month,
        totalQuantity: row.totalQuantity,
      }));

      res.status(200).json(data);
    });
  } catch (error) {
    console.error("Error fetching monthly sales data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/yearly-sales", authenticateToken, async (req, res) => {
  try {
    const yearlySalesQuery = `
      SELECT 
        YEAR(STR_TO_DATE(orderDatenTime, '%m-%d-%Y %h:%i %p')) AS year,
        SUM(orderQuantity) AS totalQuantity
      FROM orders
      WHERE orderStatus != 'PENDING'
        AND YEAR(STR_TO_DATE(orderDatenTime, '%m-%d-%Y %h:%i %p')) BETWEEN YEAR(CURDATE()) - 4 AND YEAR(CURDATE())
      GROUP BY year
      ORDER BY year;
    `;

    db.query(yearlySalesQuery, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

      const data = results.map((row) => ({
        year: row.year,
        totalQuantity: row.totalQuantity,
      }));

      res.status(200).json(data);
    });
  } catch (error) {
    console.error("Error fetching yearly sales data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/product-revenue", authenticateToken, async (req, res) => {
  try {
    const productRevenueQuery = `
      SELECT 
        p.productName,
        COALESCE(SUM(o.orderQuantity), 0) * p.productPrice AS totalRevenue
      FROM orders o
      JOIN products p ON o.product_id = p.product_id
      WHERE o.orderStatus != 'PENDING'
      GROUP BY p.productName
      ORDER BY totalRevenue DESC;
    `;

    db.query(productRevenueQuery, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

      const data = results.map((row) => ({
        productName: row.productName,
        totalRevenue: row.totalRevenue,
      }));

      res.status(200).json(data);
    });
  } catch (error) {
    console.error("Error fetching product revenue data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
