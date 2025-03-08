const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.get('/inventory-report', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
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

module.exports = router;