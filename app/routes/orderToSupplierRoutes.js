const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/purchaseorder/register', async (req, res) => {
    try {

        const { supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id } = req.body;

        const insertUserQuery =
          'INSERT INTO purchaseorders (supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id, timestamp_add, timestamp_update) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())';
        // const [insertPurchaseResult] = 
        await db.execute(insertUserQuery, [supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id]);
        // const purchaseorder_id = insertPurchaseResult.insertId;

        const updateQuantityQuery = 'UPDATE products SET productQuantity = productQuantity + ? WHERE product_id = ?';
        await db.execute(updateQuantityQuery, [purchaseQuantity, product_id]);

        res.status(201).json({ message: 'Purchase registered successfully, updated products' });
    } catch (error) {

        console.error('Error registering purchase:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/purchaseorders', authenticateToken, async (req, res) => {
    try {

        db.query(
          "SELECT purchaseorder_id, supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') AS timestamp_update FROM purchaseorders ORDER BY timestamp_update DESC",
          (err, result) => {
            if (err) {
              console.error("Error fetching items:", err);
              res.status(500).json({ message: "Internal Server Error" });
            } else {
              res.status(200).json(result);
            }
          }
        );

    } catch (error) {

        console.error('Error loading purchase orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/purchaseorder/:id', authenticateToken, async (req, res) => {
    
    let purchaseorder_id = req.params.id;

    if (!purchaseorder_id) {
        return req.status(400).send({ error: true, message: 'Please provide purchaseorder_id' });  
    }

    try {

        db.query(
            "SELECT purchaseorder_id, supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') as timestamp_update FROM purchaseorders WHERE purchaseorder_id = ?",
            purchaseorder_id,
            (err, result) => {
            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading purchase order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/purchaseorder/:id', authenticateToken, async (req, res) => {

    let purchaseorder_id = req.params.id;

    const {supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id} = req.body;

    if (!purchaseorder_id || !supplier_id || !product_id || !purchaseQuantity || !receivedMoney || !purchaseStatus || !user_id) {
        return req.status(400).send({ error: user, message: 'Please provide  supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus and user_id' });  
    }

    try {

        db.query('UPDATE purchaseorders SET supplier_id = ?, product_id = ?, purchaseQuantity = ?, receivedMoney = ?, purchaseStatus = ?, user_id = ?, timestamp_update = NOW() WHERE purchaseorder_id = ?', [supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id, purchaseorder_id], async (err, result, fields) => {

            if (err) {
                console.error('Error updating items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading purchase order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
});

router.delete('/purchaseorder/:id', authenticateToken, async (req, res) => {
    
    let purchaseorder_id = req.params.id;

    if (!purchaseorder_id) {
        return res.status(400).send({ error: true, message: 'Please provide purchaseorder_id' });  
    }

    try {

        db.query('DELETE FROM purchaseorders WHERE purchaseorder_id = ?', purchaseorder_id, (err, result, fields) => {

            if (err) {
                console.error('Error deleting items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading purchase order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;