const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/supplier/register', async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const { name, username } = req.body;

            const checkSupplierQuery = `SELECT * FROM suppliers WHERE username = ?`;
            const [existingSupplier] = await connection.execute(checkSupplierQuery, [username]);

            if (existingSupplier.length > 0) {
                return res.status(409).json({ message: 'Username already exists. Please choose another.' });
            }

            const insertCustomerQuery = `
                INSERT INTO 
                    suppliers (
                    name, 
                    username) 
                VALUES (?, ?)`;
            await connection.execute(insertCustomerQuery, [name, username]);

            await connection.commit();
            res.status(201).json({ message: 'Supplier registered successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error registering Supplier:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/suppliers", authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    supplier_id, 
                    name, 
                    username, 
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add, 
                    DATE_FORMAT(timestamp_update, '%m/%d/%Y %h:%i %p') AS timestamp_update 
                FROM 
                    suppliers 
                ORDER BY 
                    timestamp_update DESC`);
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading suppliers:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/supplier/:id", authenticateToken, async (req, res) => {
    let supplier_id = req.params.id;

    if (!supplier_id) {
        return req
        .status(400)
        .send({ error: true, message: "Please provide supplier_id" });
    }

    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    supplier_id, 
                    name, username, 
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add, 
                    DATE_FORMAT(timestamp_update, '%m/%d/%Y %h:%i %p') AS timestamp_update 
                FROM 
                    suppliers 
                WHERE 
                    supplier_id = ?`,
                [supplier_id]
            );
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading supplier:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/supplier/:id', authenticateToken, async (req, res) => {
    let supplier_id = req.params.id;

    const { name, username } = req.body;

    if (!supplier_id || !name || !username) {
        return res.status(400).send({ error: true, message: 'Please provide name and username' });
    }

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const checkSupplierQuery = `
                SELECT 
                    * 
                FROM 
                    suppliers 
                WHERE 
                    username = ? 
                AND 
                    supplier_id != ?`;
            const [existingSupplier] = await connection.execute(checkSupplierQuery, [username, supplier_id]);

            if (existingSupplier.length > 0) {
                return res.status(409).json({ message: 'Username already exists. Please choose another.' });
            }

            const updateUserQuery = `
                UPDATE 
                    suppliers 
                SET 
                    name = ?, 
                    username = ?, 
                    timestamp_update = NOW() 
                WHERE supplier_id = ?`;
            await connection.execute(updateUserQuery, [
                name, 
                username, 
                supplier_id
            ]);

            await connection.commit();
            res.status(200).json({ message: 'Supplier updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error updating supplier:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete("/supplier/:id", authenticateToken, async (req, res) => {
    let supplier_id = req.params.id;

    if (!supplier_id) {
        return res
        .status(400)
        .send({ error: true, message: "Please provide supplier_id" });
    }

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            await connection.execute("DELETE FROM suppliers WHERE supplier_id = ?", [supplier_id]);
            
            await connection.commit();
            res.status(200).json({ message: "Supplier deleted successfully" });
        } catch (error) {
            await connection.rollback();
            console.error("Error deleting supplier:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;