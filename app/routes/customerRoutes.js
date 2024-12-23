const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/customer/register', async (req, res) => {
    try{   
        const {name, username} = req.body;

        const checkUserQuery = 'SELECT * FROM customers WHERE username = ?';
        const [existingUser ] = await db.promise().execute(checkUserQuery, [username]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Username already exists. Please choose another.' });
        }

        const insertUserQuery = 'INSERT INTO customers (name, username, ccreation_date) VALUES (?, ?, DATE_FORMAT(NOW(), "%m-%d-%Y %h:%i %p"))';
        await db.promise().execute(insertUserQuery, [name, username]);

        res.status(201).json({ message: 'Customer registered successfully' });
    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/customers', authenticateToken, async (req, res) => {
    try {

        db.query('SELECT customer_id, name, username, ccreation_date FROM customers', (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading customers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/customer/:id', authenticateToken, async (req, res) => {
    
    let customer_id = req.params.id;

    if (!customer_id) {
        return req.status(400).send({ error: true, message: 'Please provide customer_id' });  
    }

    try {

        db.query('SELECT customer_id, name, username, ccreation_date FROM customers WHERE customer_id = ?', customer_id, (err, result) => {

            if (err) {
                console.error('Error fetching items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/customer/:id', authenticateToken, async (req, res) => {
    let customer_id = req.params.id;
    const {name, username} = req.body;

    if (!customer_id || !name || !username) {
        return res.status(400).send({ error: true, message: 'Please provide name and username' });  
    }

    try {

        const checkUserQuery = 'SELECT * FROM customers WHERE username = ? AND customer_id != ?';
        const [existingUser ] = await db.promise().execute(checkUserQuery, [username, customer_id]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Username already exists. Please choose another.' });
        }

        const updateUserQuery = 'UPDATE customers SET name = ?, username = ?, ccreation_date = DATE_FORMAT(NOW(), "%m-%d-%Y %h:%i %p") WHERE customer_id = ?';
        await db.promise().execute(updateUserQuery, [name, username, customer_id]);

        res.status(200).json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
});

router.delete('/customer/:id', authenticateToken, async (req, res) => {
    
    let customer_id = req.params.id;

    if (!customer_id) {
        return res.status(400).send({ error: true, message: 'Please provide customer_id' });  
    }

    try {

        db.query('DELETE FROM customers WHERE customer_id = ?', customer_id, (err, result, fields) => {

            if (err) {
                console.error('Error deleting items:', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json(result);
            }
        });

    } catch (error) {

        console.error('Error loading customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;