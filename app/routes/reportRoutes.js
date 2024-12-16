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
                COALESCE(p.productQuantity, 0) - COALESCE(o.orderQuantity, 0) + COALESCE(f.freshproductQuantity, 0) AS InitialQuantity,
                p.productQuantity AS CountedQuantity, 
                COALESCE(p.productQuantity, 0) - (COALESCE(p.productQuantity, 0) - COALESCE(o.orderQuantity, 0) + COALESCE(f.freshproductQuantity, 0)) AS Discrepancy
            FROM 
                products p
            LEFT JOIN 
                orders o ON p.product_id = o.product_id AND o.orderStatus != 'PENDING'
            LEFT JOIN 
                freshproducts f ON p.product_id = f.product_id
            GROUP BY 
                p.productType, p.product_id, p.productName, p.productCode, p.productQuantity;
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
                p.productType, p.product_id, p.productName, p.productCode, p.productPrice, p.productQuantity;
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