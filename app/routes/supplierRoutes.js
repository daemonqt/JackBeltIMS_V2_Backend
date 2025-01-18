const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/supplier/register', async (req, res) => {
    try {
        const { name, username } = req.body;

        const checkUserQuery = 'SELECT * FROM suppliers WHERE username = ?';
        const [existingUser ] = await db.execute(checkUserQuery, [username]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Username already exists. Please choose another.' });
        }

        const insertUserQuery = 'INSERT INTO suppliers (name, username, timestamp_add, timestamp_update) VALUES (?, ?, NOW(), NOW())';
        await db.execute(insertUserQuery, [name, username]);

        res.status(201).json({ message: 'Supplier registered successfully' });
    } catch (error) {
        console.error('Error registering Supplier:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/suppliers', authenticateToken, async (req, res) => {
    try {

        db.execute(
          "SELECT supplier_id, name, username, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') AS timestamp_update FROM suppliers ORDER BY timestamp_update DESC",
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

        console.error('Error loading suppliers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/supplier/:id', authenticateToken, async (req, res) => {
    
    let supplier_id = req.params.id;

    if (!supplier_id) {
        return req.status(400).send({ error: true, message: 'Please provide supplier_id' });  
    }

    try {

        db.execute(
          "SELECT supplier_id, name, username, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') AS timestamp_update FROM suppliers WHERE supplier_id = ?",
          supplier_id,
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

        console.error('Error loading supplier:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/supplier/:id', authenticateToken, async (req, res) => {
    let supplier_id = req.params.id;
    const { name, username } = req.body;

    if (!supplier_id || !name || !username) {
        return res.status(400).send({ error: true, message: 'Please provide name and username' });
    }

    try {
        
        const checkUserQuery = 'SELECT * FROM suppliers WHERE username = ? AND supplier_id != ?';
        const [existingUser ] = await db.execute(checkUserQuery, [username, supplier_id]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Username already exists. Please choose another.' });
        }

        const updateUserQuery = 'UPDATE suppliers SET name = ?, username = ?, timestamp_update = NOW() WHERE supplier_id = ?';
        await db.execute(updateUserQuery, [name, username, supplier_id]);

        res.status(200).json({ message: 'Supplier updated successfully' });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/supplier/:id', authenticateToken, async (req, res) => {
    
    let supplier_id = req.params.id;

    if (!supplier_id) {
        return res.status(400).send({ error: true, message: 'Please provide supplier_id' });  
    }

    try {

        db.execute('DELETE FROM suppliers WHERE supplier_id = ?', supplier_id, (err, result, fields) => {

            if (err) {
                console.error('Error deleting items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading supplier:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;