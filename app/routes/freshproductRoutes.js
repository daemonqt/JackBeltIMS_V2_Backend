const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/fresh-products/register', async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const { product_id, freshproductQuantity, user_id  } = req.body;

            const quantity = Number(freshproductQuantity);
            if (isNaN(quantity) || freshproductQuantity === '' || freshproductQuantity === null || quantity < 0) {
                return res.status(400).json({ error: 'Quantity must be a number greaterthan zero.' });
            }

            const [fetchProductData] = await connection.execute(`
                SELECT
                    productVariant,
                    productCode
                FROM
                    products
                WHERE
                    product_id = ?`, [product_id]);
            if (fetchProductData.length === 0) {
                return res.status(404).json({ error: "Product not found." });
            }
            const {productVariant, productCode} = fetchProductData[0];
            const [fetchUserData] = await connection.execute(`
                SELECT
                    name
                FROM
                    users
                WHERE
                    user_id = ?`, [user_id]);
            if (fetchUserData.length === 0) {
                return res.status(404).json({ error: "User not found." });
            }
            const { name: userName } = fetchUserData[0];
            const insertUserQuery = `
                INSERT INTO 
                    freshproducts (
                        product_id, 
                        productVariant,
                        productCode,
                        freshproductQuantity, 
                        user_id,
                        userName
                    ) VALUES (?, ?, ?, ?, ?, ?)`;
            await connection.execute(insertUserQuery, [
                product_id, 
                productVariant,
                productCode,
                freshproductQuantity, 
                user_id,
                userName,
            ]);

            const updateQuantityQuery = `
                UPDATE 
                    products 
                SET 
                    productQuantity = productQuantity + ? 
                WHERE 
                    product_id = ?`;
            await connection.execute(updateQuantityQuery, [freshproductQuantity, product_id]);

            await connection.commit();
            res.status(201).json({ message: 'Product quantity increased, updated products' });
        } catch (error) {
            await connection.rollback();
            console.error('Error adding quantity:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/fresh-products", authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    freshproduct_id, 
                    product_id, 
                    productVariant,
                    productCode,
                    freshproductQuantity, 
                    user_id, 
                    userName,
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add, 
                    DATE_FORMAT(timestamp_update, '%m/%d/%Y %h:%i %p') as timestamp_update 
                FROM 
                    freshproducts 
                ORDER BY 
                    timestamp_update DESC`);
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading products:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/products/product-category", authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    product_id, 
                    productType, 
                    productCode, 
                    productImage, 
                    productName, 
                    productVariant, 
                    productQuantity, 
                    productPrice,
                    priceAdjustment,
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add, 
                    DATE_FORMAT(timestamp_update, '%m/%d/%Y %h:%i %p') AS timestamp_update 
                FROM
                    products 
                WHERE 
                    productType = 'PRODUCT'
            `);
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading products:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/fresh-products/:id', authenticateToken, async (req, res) => {
    let freshproduct_id = req.params.id;

    if (!freshproduct_id) {
        return req
        .status(400)
        .send({ error: true, message: 'Please provide freshproduct_id' });
    }

    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    freshproduct_id, 
                    product_id, 
                    productVariant,
                    productCode,
                    freshproductQuantity, 
                    user_id, 
                    userName,
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add, 
                    DATE_FORMAT(timestamp_update, '%m/%d/%Y %h:%i %p') as timestamp_update 
                FROM 
                    freshproducts 
                WHERE
                    freshproduct_id = ?`,
                [freshproduct_id]
            );
            res.status(200).json(results);
        } catch (error) {
            console.error('Error loading product:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/fresh-products/:id', authenticateToken, async (req, res) => {
    let freshproduct_id = req.params.id;

    const { product_id, freshproductQuantity, user_id } = req.body;

    if (!freshproduct_id || !product_id || freshproductQuantity === undefined || !user_id) {
        return req.status(400).send({ error: user, message: 'Please provide product_id, freshproductQuantity and user_id' });
    }

    const quantity = Number(freshproductQuantity);
    if (isNaN(quantity) || freshproductQuantity === '' || freshproductQuantity === null || quantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a number greaterthan zero.' });
    }
    
    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const updateUserQuery =
                "UPDATE freshproducts SET product_id = ?, freshproductQuantity = ?, user_id = ?, timestamp_update = NOW() WHERE freshproduct_id = ?";
            await connection.execute(updateUserQuery, [product_id, freshproductQuantity, user_id, freshproduct_id]);
            
            await connection.commit();
            res.status(200).json({ message: "Product updated successfully" });
        } catch (error) {
            await connection.rollback();
            console.error('Error updating product:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/fresh-products/:id', authenticateToken, async (req, res) => {
    let freshproduct_id = req.params.id;

    if (!freshproduct_id) {
        return res
        .status(400)
        .send({ error: true, message: 'Please provide freshproduct_id' });  
    }

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            await connection.execute("DELETE FROM freshproducts WHERE freshproduct_id = ?", [freshproduct_id]);
            
            await connection.commit();
            res.status(200).json({ message: "Product deleted successfully" });
        } catch (error) {
            await connection.rollback();
            console.error('Error deleting product:', error);
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