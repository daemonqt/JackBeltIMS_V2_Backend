const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.get('/report/inventory', authenticateToken, async (req, res) => {
    try {
        const inventoryReportQuery = `
            SELECT
                p.productName AS Product, 
                p.productCode AS ProductCode,
                p.productType AS ProductType,
                p.productQuantity + COALESCE(o.OrderQ, 0) - COALESCE(f.FreshQ, 0) - COALESCE(po.PurchaseQ, 0) AS InitialQuantity,
                COALESCE(f.FreshQ, 0) + COALESCE(po.PurchaseQ, 0) AS AddedStock,
                COALESCE(o.OrderQ, 0) AS UnitSold,
                p.productQuantity AS CountedQuantity,
                p.productQuantity - (p.productQuantity + COALESCE(o.OrderQ, 0) - COALESCE(f.FreshQ, 0) - COALESCE(po.PurchaseQ, 0)) AS Discrepancy
            FROM 
                products p
            LEFT JOIN 
                (SELECT product_id, COALESCE(SUM(orderQuantity), 0) AS OrderQ
                FROM orders
                GROUP BY product_id) o ON p.product_id = o.product_id
            LEFT JOIN 
                (SELECT product_id, COALESCE(SUM(freshproductQuantity), 0) AS FreshQ
                FROM freshproducts
                GROUP BY product_id) f ON p.product_id = f.product_id
            LEFT JOIN 
                (SELECT product_id, COALESCE(SUM(purchaseQuantity), 0) AS PurchaseQ
                FROM purchaseorders
                GROUP BY product_id) po ON p.product_id = po.product_id
            GROUP BY 
                p.product_id, p.productName, p.productCode, p.productType, p.productQuantity
            ORDER BY
                ProductType DESC, ProductCode;
        `;
        
        db.query(inventoryReportQuery, (err, result) => {
            if (err) {
                console.error('Error generating inventory report:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/report/overallsale', authenticateToken, async (req, res) => {
    try {
        const salesReportQuery = `
            SELECT 
                p.productName AS Product, 
                p.productCode AS ProductCode,
                p.productType AS ProductType,
                p.productPrice AS Price,
                COALESCE(SUM(o.orderQuantity), 0) AS UnitSold,
                COALESCE(SUM(o.orderQuantity), 0) * p.productPrice AS Revenue
            FROM 
                products p
            LEFT JOIN 
                orders o ON p.product_id = o.product_id AND o.orderStatus != 'PENDING'
            GROUP BY 
                p.product_id, p.productName, p.productCode, p.productType, p.productPrice, p.productQuantity
            ORDER BY
                ProductType DESC, ProductCode;
        `;
        
        db.query(salesReportQuery, (err, result) => {
            if (err) {
                console.error('Error overall-sale report:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;