const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.get('/inventory-report', authenticateToken, async (req, res) => {
    try {
        const inventoryReportQuery = `
            SELECT 
                p.productName, 
                p.productCode,
                p.productPrice,
                p.productQuantity, 
                COALESCE(o.orderQuantity, 0) AS orderQuantity, 
                COALESCE(p.productQuantity, 0) + COALESCE(o.orderQuantity, 0) AS totalQuantity,
                COALESCE(o.orderQuantity, 0) * p.productPrice AS productRevenue
            FROM 
                products p
            LEFT JOIN 
                orders o ON p.product_id = o.product_id AND o.orderStatus != 'PENDING'
            GROUP BY 
                p.product_id;
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

module.exports = router;