const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db.js');
const secretKey = require('../secretkey/secretkey.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/user/register', async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const {name, username, role_id, password} = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);

            const checkUserQuery = `
                SELECT 
                    * 
                FROM 
                    users 
                WHERE 
                    username = ?`;
            const [existingUser] = await connection.execute(checkUserQuery, [username]);

            if (existingUser.length > 0) {
                return res.status(409).json({ message: 'Username already exists' });
            }

            const insertUserQuery = `
                INSERT INTO 
                    users  (
                    name, 
                    username, 
                    role_id, 
                    password) 
                VALUES (?, ?, ?, ?)`;
            await connection.execute(insertUserQuery, [name, username, role_id, hashedPassword]);

            await connection.commit();
            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error registering user:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/user/login', async (req, res) => {
    try {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            const { username, password } = req.body;

            const getUserQuery = `
                SELECT 
                    u.*, 
                    r.rolename
                FROM 
                    users u
                JOIN 
                    roles r 
                ON 
                    u.role_id = r.role_id
                WHERE 
                    u.username = ?`;
            const [rows] = await connection.execute(getUserQuery, [username]);

            if (rows.length === 0) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const user = rows[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    username: user.username,
                    name: user.name,
                    role_id: user.role_id,
                    rolename: user.rolename
                },
                secretKey,
                { expiresIn: '10h' }
            );

            await connection.commit();
            res.status(200).json({ token, role: user.rolename });
        } catch (error) {
            await connection.rollback();
            console.error('Error logging in user:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/users", authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
    
        try {
            const [results] = await connection.execute(`
                SELECT 
                    user_id, 
                    role_id, 
                    name, 
                    username, 
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add, 
                    DATE_FORMAT(timestamp_update, '%m/%d/%Y %h:%i %p') AS timestamp_update 
                    FROM 
                        users 
                    ORDER BY 
                        timestamp_update DESC`);
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading users:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/user/:id", authenticateToken, async (req, res) => {
    let user_id = req.params.id;

    if (!user_id) {
        return req
        .status(400)
        .send({ error: true, message: "Please provide user_id" });
    }
    
    try {
        const connection = await db.getConnection();
        try {
            const [results] = await connection.execute(`
                SELECT 
                    user_id, 
                    role_id, 
                    name, 
                    username, 
                    password,  
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add, 
                    DATE_FORMAT(timestamp_update, '%m/%d/%Y %h:%i %p') AS timestamp_update 
                FROM 
                    users 
                WHERE 
                    user_id = ?`,
            [user_id]);
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading user:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/user/:id', authenticateToken, async (req, res) => {
    let user_id = req.params.id;

    const {name, username, role_id, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!user_id || !name || !username || !role_id || !password) {
        return req.status(400).send({ error: user, message: 'Please provide name, username, role_id and password' });  
    }
    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const checkUserQuery = `
                SELECT 
                    * 
                FROM 
                    users 
                WHERE 
                    username = ?
                AND 
                    user_id != ?`;
            const [existingUser] = await connection.execute(checkUserQuery, [
                username, 
                user_id
            ]);

            if (existingUser.length > 0) {
                return res.status(409).json({ message: 'Username already exists' });
            }

            const updateUserQuery = `
                UPDATE 
                    users 
                SET 
                    name = ?, 
                    username = ?, 
                    password = ?, 
                    role_id = ?, 
                    timestamp_update = NOW() 
                WHERE 
                    user_id = ?`;
            await connection.execute(updateUserQuery, [
                name, 
                username, 
                hashedPassword, 
                role_id, 
                user_id
            ]);

            await connection.commit();
            res.status(200).json({ message: 'User updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete("/user/:id", authenticateToken, async (req, res) => {
    let user_id = req.params.id;

    if (!user_id) {
        return res
        .status(400)
        .send({ error: true, message: "Please provide user_id" });
    }

    try {
        const connection = await db.getConnection();
    
        try {
            await connection.beginTransaction();
            await connection.execute("DELETE FROM users WHERE user_id = ?", [user_id]);

            await connection.commit();
            res.status(200).json({ message: "User  deleted successfully" });
        } catch (error) {
            await connection.rollback();
            console.error("Error deleting user:", error);
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
