const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/role/register', async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const {rolename} = req.body;

            const checkUserQuery = 'SELECT * FROM roles WHERE rolename = ?';
            const [existingUser ] = await connection.execute(checkUserQuery, [rolename]);

            if (existingUser .length > 0) {
                return res.status(409).json({ message: 'Rolename already exists' });
            }

            const insertUserQuery = 'INSERT INTO roles (rolename) VALUES (?)';
            await connection.execute(insertUserQuery, [rolename]);

            await connection.commit();
            res.status(201).json({ message: 'Role registered successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error registering role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/roles', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(
                "SELECT role_id, rolename FROM roles"
            );
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading roles:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/role/:id", authenticateToken, async (req, res) => {
    let role_id = req.params.id;

    if (!role_id) {
        return req
        .status(400)
        .send({ error: true, message: "Please provide role_id" });
    }

    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(
                "SELECT role_id, rolename FROM roles WHERE role_id = ?",
                [role_id]
            );
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading role:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/role/:id', authenticateToken, async (req, res) => {
    let role_id = req.params.id;

    const {rolename} = req.body;

    if (!rolename) {
        return req.status(400).send({ error: user, message: 'Please provide rolename' });  
    }

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const checkUserQuery = 'SELECT * FROM roles WHERE rolename = ? AND role_id != ?';
            const [existingUser ] = await connection.execute(checkUserQuery, [rolename, role_id]);

            if (existingUser .length > 0) {
                return res.status(409).json({ message: 'Rolename already exists' });
            }

            const updateUserQuery = 'UPDATE roles SET rolename = ? WHERE role_id = ?';
            await connection.execute(updateUserQuery, [rolename, role_id]);

            await connection.commit();
            res.status(200).json({ message: 'Role updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error updating role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/role/:id', authenticateToken, async (req, res) => {
    let role_id = req.params.id;

    if (!role_id) {
        return res
        .status(400)
        .send({ error: true, message: 'Please provide role_id' });  
    }

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            await connection.execute('DELETE FROM roles WHERE role_id = ?', [role_id]);

            await connection.commit();
            res.status(200).json({ message: "Role deleted successfully" });
        } catch (error) {
            await connection.rollback();
            console.error("Error deleting role:", error);
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
