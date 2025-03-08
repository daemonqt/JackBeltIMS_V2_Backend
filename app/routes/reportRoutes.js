const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.get('/report/inventory', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
    
        try {
            const [results] = await connection.execute(`
                SELECT
                    p.productName AS Product,
                    p.productVariant AS Variant,
                    p.productCode AS ProductCode,
                    p.productType AS ProductType,
                    p.productQuantity + COALESCE(od.OrderQ, 0) - COALESCE(f.FreshQ, 0) - COALESCE(po.PurchaseQ, 0) AS InitialQuantity,
                    COALESCE(f.FreshQ, 0) + COALESCE(po.PurchaseQ, 0) AS AddedStock,
                    COALESCE(od.OrderQ, 0) AS UnitSold,
                    p.productQuantity AS CountedQuantity,
                    p.productQuantity - (p.productQuantity + COALESCE(od.OrderQ, 0) - COALESCE(f.FreshQ, 0) - COALESCE(po.PurchaseQ, 0)) AS Discrepancy
                FROM 
                    products p
                LEFT JOIN 
                    (SELECT product_id, COALESCE(SUM(orderQuantity), 0) AS OrderQ
                    FROM order_details
                    GROUP BY product_id) od ON p.product_id = od.product_id
                LEFT JOIN 
                    (SELECT product_id, COALESCE(SUM(freshproductQuantity), 0) AS FreshQ
                    FROM freshproducts
                    GROUP BY product_id) f ON p.product_id = f.product_id
                LEFT JOIN 
                    (SELECT product_id, COALESCE(SUM(purchaseQuantity), 0) AS PurchaseQ
                    FROM purchaseorders
                    GROUP BY product_id) po ON p.product_id = po.product_id
                -- GROUP BY 
                    -- p.product_id, p.productName, p.productVariant, p.productCode, p.productType, p.productQuantity
                ORDER BY
                    ProductType DESC, CAST(SUBSTRING_INDEX(Variant, '"', 1) AS UNSIGNED) ASC;
            `);
            res.status(200).json(results);
        } catch (error) {
            console.error('Error generating inventory report:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/report/overallsale', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
        try {
            const [results] = await connection.execute(`
                SELECT 
                    p.productName AS Product, 
                    p.productVariant AS Variant,
                    p.productCode AS ProductCode,
                    p.productType AS ProductType,
                    p.productPrice AS Price,
                    COALESCE(SUM(od.orderQuantity), 0) AS UnitSold,
                    COALESCE(SUM(od.orderQuantity), 0) * p.productPrice AS Revenue
                FROM 
                    products p
                LEFT JOIN 
                    order_details od ON p.product_id = od.product_id
                GROUP BY 
                    p.product_id, p.productName, p.productCode, p.productType, p.productPrice, p.productQuantity
                ORDER BY
                    ProductType DESC, CAST(SUBSTRING_INDEX(Variant, '"', 1) AS UNSIGNED) ASC;
            `);
            res.status(200).json(results);
        } catch (error) {
            console.error('Error generating sales report:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;