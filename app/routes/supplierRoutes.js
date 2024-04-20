const express = require('express');
const router = express.Router();
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
const db = require('../database/db.js');
// const secretKey = require('../secretkey/secretkey.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/supplier/register', async (req, res) => {
    try{
            
        const {name, username} = req.body;

        const insertUserQuery = 'INSERT INTO suppliers (name, username, screation_date) VALUES (?, ?, DATE_FORMAT(NOW(), "%m-%d-%Y %h:%i %p"))';
        await db.promise().execute(insertUserQuery, [name, username]);

        res.status(201).json({ message: 'Supplier registered successfully' });
    } catch (error) {
        
        console.error('Error registering Supplier:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/suppliers', authenticateToken, async (req, res) => {
    try {

        db.query('SELECT supplier_id, name, username, screation_date FROM suppliers', (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading suppliers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/suppliers/count', authenticateToken, async (req, res) => {
    try {
        db.query('SELECT COUNT(*) AS supplierCount FROM suppliers', (err, result) => {
            if (err) {
                console.error('Error fetching supplier count:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                const supplierCount = result[0].supplierCount;
                res.status(200).json({ supplierCount });
            }
        });
    } catch (error) {
        console.error('Error loading supplier count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/supplier/:id', authenticateToken, async (req, res) => {
    
    let supplier_id = req.params.id;

    if (!supplier_id) {
        return req.status(400).send({ error: true, message: 'Please provide supplier_id' });  
    }

    try {

        db.query('SELECT supplier_id, name, username, screation_date FROM suppliers WHERE supplier_id = ?', supplier_id, (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
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

router.put('/supplier/:id', authenticateToken, async (req, res) => {

    let supplier_id = req.params.id;

    const {name, username} = req.body;

    if (!supplier_id || !name || !username) {
        return req.status(400).send({ error: user, message: 'Please provide name and username' });  
    }

    try {

        db.query('UPDATE suppliers SET name = ?, username = ?, screation_date = DATE_FORMAT(NOW(), "%m-%d-%Y %h:%i %p") WHERE supplier_id = ?', [name, username, supplier_id], (err, result, fields) => {

            if (err) {
                console.error('Error updating items:', err);
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

router.delete('/supplier/:id', authenticateToken, async (req, res) => {
    
    let supplier_id = req.params.id;

    if (!supplier_id) {
        return res.status(400).send({ error: true, message: 'Please provide supplier_id' });  
    }

    try {

        db.query('DELETE FROM suppliers WHERE supplier_id = ?', supplier_id, (err, result, fields) => {

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