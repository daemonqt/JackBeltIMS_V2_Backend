const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

function generateRandomNumber(length) {
    let randomNumber = "";
    for (let i = 0; i < length; i++) {
        randomNumber += Math.floor(Math.random() * 10);
    }
    return randomNumber;
}

router.post('/purchaseorder/add-stock', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { supplier_id, product_id, purchaseQuantity, purchasePayment, user_id } = req.body;
            if (
                !supplier_id ||
                !product_id ||
                !purchaseQuantity ||
                !purchasePayment ||
                !user_id
            ) {
                return res.status(400).json({ error: "All fields are required." });
            }
            const [fetchSupplierData] = await connection.execute(`
                SELECT * FROM suppliers WHERE supplier_id = ?`, [supplier_id]);
            if (fetchSupplierData.length === 0) {
                return res.status(404).json({ error: "Supplier not found." });
            }
            const [fetchProductData] = await connection.execute(`
                SELECT * FROM products WHERE product_id = ?`, [product_id]);
            if (fetchProductData.length === 0) {
                return res.status(404).json({ error: "Product not found." });
            }
            const [fetchUserData] = await connection.execute(`
                SELECT * FROM users WHERE user_id = ?`, [user_id]);
            if (fetchUserData.length === 0) {
                return res.status(404).json({ error: "User not found." });
            }

            const { name: supplierName } = fetchSupplierData[0];
            const { productName: productName, productVariant: productVariant, productCode: productCode } = fetchProductData[0];
            const { name: userName } = fetchUserData[0];

            
            const insertPurchaseQuery =`
                INSERT INTO 
                    purchaseorders (
                        supplier_id,
                        supplierName,
                        product_id, 
                        productName,
                        productVariant,
                        productCode,
                        purchaseQuantity, 
                        purchasePayment,
                        purchaseTransaction,
                        user_id,
                        userName
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RESTOCK', ?, ?)`;
            await connection.execute(insertPurchaseQuery, [
                supplier_id,
                supplierName,
                product_id,
                productName,
                productVariant,
                productCode,
                purchaseQuantity,
                purchasePayment,
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
            await connection.execute(updateQuantityQuery, [purchaseQuantity, product_id]);

            await connection.commit();
            res.status(201).json({ message: 'Purchase registered successfully, updated products' });
        } catch (error) {
            await connection.rollback();
            console.error('Error registering purchase:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/purchaseorder/register-product', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { 
                supplier_id, 
                productType, 
                productName, 
                productVariant, 
                productQuantity, 
                productPrice, 
                purchasePayment, 
                user_id 
            } = req.body;
            if (
                !supplier_id || 
                !productType ||
                !productName ||
                !productVariant || 
                !productQuantity ||
                !productPrice || 
                !purchasePayment ||
                !user_id
            ) {
                return res.status(400).json({ error: "All fields are required." });
            }

            const prodquantity = Number(productQuantity);
            const prodprice = Number(productPrice);
            const prodpayment = Number(purchasePayment);

            if (isNaN(prodquantity) || prodquantity < 1) {
                return res.status(400).json({ error: 'Product quantity must be a number greater than or equal to 1.' });
            }
            if (isNaN(prodprice) || prodprice < 0) {
                return res.status(400).json({ error: 'Product price must be a number greater than or equal to zero.' });
            }
            if (isNaN(prodpayment) || prodpayment < 0) {
                return res.status(400).json({ error: 'Purchase payment must be a number greater than or equal to zero.' });
            }

            const randomDigits = generateRandomNumber(10);
            const productCode = `PROD-${randomDigits}`;

            const checkProductCodeQuery = 'SELECT * FROM products WHERE productCode = ?';
            const checkProductVariantQuery = 'SELECT * FROM products WHERE productVariant = ?';
            const [existingProductCode] = await connection.execute(checkProductCodeQuery, [productCode]);
            const [existingProductVariant] = await connection.execute(checkProductVariantQuery, [productVariant]);

            if (existingProductCode.length > 0) {
                return res.status(409).json({ message: 'Product code already exists' });
            }
            if (existingProductVariant.length > 0) {
                return res.status(409).json({ message: 'Product variant already exists' });
            }

            const insertProductQuery = `
                INSERT INTO products (
                    productType, 
                    productCode,
                    productName, 
                    productVariant, 
                    productQuantity, 
                    productPrice,
                    priceAdjustment
                ) VALUES (?, ?, ?, ?, ?, ?, 'NONE')
            `;
            const [AddProductResult] = await connection.execute(insertProductQuery, [
                productType,
                productCode,
                productName, 
                productVariant, 
                productQuantity, 
                productPrice
            ]);

            const product_id = AddProductResult.insertId;

            const insertPriceHistoryQuery = `
                INSERT INTO price_history (
                    product_id,
                    priceHistory
                ) VALUES (?, ?)
            `;
            await connection.execute(insertPriceHistoryQuery, [product_id, productPrice]);

            const [fetchSupplierData] = await connection.execute(`
                SELECT * FROM suppliers WHERE supplier_id = ?`, [supplier_id]);
            if (fetchSupplierData.length === 0) {
                return res.status(404).json({ error: "Supplier not found." });
            }
            const [fetchUserData] = await connection.execute(`
                SELECT * FROM users WHERE user_id = ?`, [user_id]);
            if (fetchUserData.length === 0) {
                return res.status(404).json({ error: "User not found." });
            }
            const { name: supplierName } = fetchSupplierData[0];
            const { name: userName } = fetchUserData[0];

            const insertPurchaseQuery =`
                INSERT INTO 
                    purchaseorders (
                        supplier_id,
                        supplierName,
                        product_id,
                        productName,
                        productVariant,
                        productCode,
                        purchaseQuantity, 
                        purchasePayment,
                        purchaseTransaction,
                        user_id,
                        userName
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW PRODUCT', ?, ?)`;
            await connection.execute(insertPurchaseQuery, [
                supplier_id,
                supplierName,
                product_id,
                productName,
                productVariant,
                productCode,
                productQuantity,
                purchasePayment,
                user_id,
                userName,
            ]);

            await connection.commit();
            return res.status(201).json({ message: 'Purchase registered successfully, products updated' });
        } catch (error) {
            await connection.rollback();
            console.error('Error registering purchase:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/purchaseorders", authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    purchaseorder_id, 
                    supplier_id, 
                    supplierName,
                    product_id,
                    productVariant,
                    productCode,
                    purchaseQuantity, 
                    purchasePayment,
                    purchaseTransaction, 
                    user_id, 
                    userName,
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add
                FROM 
                    purchaseorders 
                ORDER BY 
                    timestamp_add DESC;
            `);
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading purchases:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/purchaseorder/:id", authenticateToken, async (req, res) => {
    let purchaseorder_id = req.params.id;

    if (!purchaseorder_id) {
        return req
        .status(400)
        .send({ error: true, message: "Please provide purchaseorder_id" });
    }

    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    purchaseorder_id, 
                    supplier_id, 
                    supplierName,
                    product_id,
                    productVariant,
                    productCode,
                    purchaseQuantity, 
                    purchasePayment, 
                    purchaseTransaction,
                    user_id, 
                    userName,
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add
                FROM 
                    purchaseorders
                WHERE
                    purchaseorder_id = ?
                `,[purchaseorder_id]
            );
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading purchase:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/products/other-category", authenticateToken, async (req, res) => {
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
                    productType != 'PRODUCT'
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

// router.put('/purchaseorder/:id', authenticateToken, async (req, res) => {
//     let purchaseorder_id = req.params.id;
//     const {supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id} = req.body;

//     if (!purchaseorder_id || !supplier_id || !product_id || !purchaseQuantity || !receivedMoney || !purchaseStatus || !user_id) {
//         return req.status(400).send({ error: user, message: 'Please provide  supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus and user_id' });  
//     }

//     try {
//         const 
//         const updateUserQuery =
//             "UPDATE purchaseorders SET supplier_id = ?, product_id = ?, purchaseQuantity = ?, receivedMoney = ?, purchaseStatus = ?, user_id = ?, timestamp_update = NOW() WHERE purchaseorder_id = ?";
//         await connection.execute(updateUserQuery, [supplier_id, product_id, purchaseQuantity, receivedMoney, purchaseStatus, user_id, purchaseorder_id]);

//         res.status(200).json({ message: 'Purchase updated successfully' });
//     } catch (error) {
//         console.error('Error updating purchase:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.delete("/purchaseorder/:id", authenticateToken, async (req, res) => {
    let purchaseorder_id = req.params.id;

    if (!purchaseorder_id) {
        return res
        .status(400)
        .send({ error: true, message: "Please provide purchaseorder_id" });
    }

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            await connection.execute("DELETE FROM purchaseorders WHERE purchaseorder_id = ?", [purchaseorder_id,]);
            
            await connection.commit();
            res.status(200).json({ message: "Purchase deleted successfully" });
        } catch (error) {
            await connection.rollback();
            console.error("Error deleting purchase:", error);
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