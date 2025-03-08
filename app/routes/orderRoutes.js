const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');
const multer = require("multer");
const path = require("path");
const fs = require("fs");

function generateRandomNumber(length) {
    let randomNumber = "";
    for (let i = 0; i < length; i++) {
        randomNumber += Math.floor(Math.random() * 10);
    }
    return randomNumber;
}

const storage = multer.memoryStorage();
const uploadReceipt = multer({ storage });

router.post("/order/register", authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
    
        try {
            await connection.beginTransaction();
        
            const { customerName, user_id, products, orderPayment } = req.body;

            if (!Array.isArray(products) || products.length === 0) {
                return res
                .status(400)
                .json({ error: "Products array is required and cannot be empty." });
            }

            const randomDigits = generateRandomNumber(13);
            const referenceNumber = `${randomDigits}`;

            let totalQuantity = 0;
            let totalPrice = 0;

            for (const product of products) {
                const [productData] = await connection.execute(`
                    SELECT 
                        productName, 
                        productVariant, 
                        productPrice 
                    FROM 
                        products 
                    WHERE 
                        product_id = ?`,
                    [product.product_id]
                );
                if (productData.length === 0) {
                    return res
                    .status(404)
                    .json({ error: `Product with ID ${product.product_id} not found.` });
                }

                const { productName, productVariant, productPrice } = productData[0];
                const subTotal =
                    product.orderQuantity * productPrice - (product.orderDiscount || 0);

                totalQuantity += Number(product.orderQuantity);
                totalPrice += subTotal;
            }

            const orderChange = orderPayment - totalPrice;

            const insertOrderQuery = `
                INSERT INTO orders (
                    customerName,
                    referenceNumber,
                    totalQuantity,
                    totalPrice,
                    orderPayment,
                    orderChange,
                    user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const [orderResult] = await connection.execute(insertOrderQuery, [
                customerName,
                referenceNumber,
                totalQuantity,
                totalPrice,
                orderPayment,
                orderChange,
                user_id,
            ]);

            const orderId = orderResult.insertId;

            for (const product of products) {
                const [productData] = await connection.execute(`
                    SELECT 
                        productName, 
                        productVariant, 
                        productPrice 
                    FROM 
                        products 
                    WHERE 
                        product_id = ?`,
                    [product.product_id]
                );
                const { productName, productVariant, productPrice } = productData[0];
                const subTotal =
                    product.orderQuantity * productPrice - (product.orderDiscount || 0);

                const insertOrderDetailsQuery = `
                    INSERT INTO order_details (
                        order_id,
                        product_id,
                        productName,
                        productVariation,
                        orderQuantity,
                        orderDiscount,
                        subTotal
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                await connection.execute(insertOrderDetailsQuery, [
                    orderId,
                    product.product_id,
                    productName,
                    productVariant,
                    product.orderQuantity,
                    product.orderDiscount || 0,
                    subTotal,
                ]);

                
                const updateProductQuantityQuery = `
                    UPDATE 
                        products 
                    SET 
                        productQuantity = productQuantity - ? 
                    WHERE 
                        product_id = ?`;
                await connection.execute(updateProductQuantityQuery, [
                    product.orderQuantity,
                    product.product_id,
                ]);
            }

            await connection.commit();
            res.status(201).json({ message: "Order registered successfully", orderId });
        } catch (error) {
            await connection.rollback();
            console.error("Error registering order:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/orders", authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    order_id, 
                    referenceNumber, 
                    customerName,
                    totalQuantity,
                    totalPrice,
                    orderPayment,
                    orderChange, 
                    user_id, 
                    DATE_FORMAT(timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add, 
                    DATE_FORMAT(timestamp_update, '%m/%d/%Y %h:%i %p') as timestamp_update 
                FROM 
                    orders 
                ORDER BY 
                    timestamp_add DESC
            `);
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading orders:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/order/:id", authenticateToken, async (req, res) => {
    let order_id = req.params.id;

    if (!order_id) {
        return req
        .status(400)
        .send({ error: true, message: "Please provide order_id" });
    }

    try {
        const connection = await db.getConnection();

        try {
            const [results] = await connection.execute(`
                SELECT 
                    o.order_id,
                    o.customerName,
                    o.orderPayment,
                    o.orderChange,
                    o.referenceNumber,
                    o.orderReceipt,
                    od.productName,
                    od.productVariation,
                    od.orderQuantity,
                    od.orderDiscount,
                    od.subTotal,
                    o.totalQuantity,
                    o.totalPrice,
                    u.name,
                    p.productPrice,
                    DATE_FORMAT(o.timestamp_add, '%m/%d/%Y %h:%i %p') AS timestamp_add
                FROM
                    orders o
                JOIN
                    order_details od ON o.order_id = od.order_id
                LEFT JOIN
                    users u ON o.user_id = u.user_id
                LEFT JOIN
                    products p ON od.product_id = p.product_id
                WHERE
                    o.order_id = ?`,
                [order_id]
            );
            res.status(200).json(results);
        } catch (error) {
            console.error("Error loading order:", error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/order/:id', authenticateToken, uploadReceipt.single('orderReceipt'), async (req, res) => {
    let order_id = req.params.id;
    
    const orderReceipt = req.file ? req.file : null;

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            const fetchOrderQuery = `
                SELECT 
                    referenceNumber,
                    orderReceipt
                FROM 
                    orders 
                WHERE 
                    order_id = ?`;
            const [currentOrder] = await connection.execute(fetchOrderQuery, [order_id]);
            if (currentOrder.length === 0) {
                return res.status(404).json({ error: "Order not found" });
            }
            const currentOrderReceipt = currentOrder[0].orderReceipt;
            let referenceNumber = currentOrder[0].referenceNumber;
            if (orderReceipt) {
                const extension = path.extname(req.file.originalname);
                const filename = `${referenceNumber}_${Date.now()}${extension}`;
                const dir = path.join(__dirname, "../files/order-receipts/");
                const filePath = path.join(dir, filename);

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                if (currentOrderReceipt) {
                    const currentReceiptPath = path.join(dir, currentOrderReceipt);
                    fs.unlink(currentReceiptPath, (err) => {
                        if (err) {
                            console.error('Failed to delete existing receipt:', err);
                        }
                    });
                }

                fs.writeFile(filePath, req.file.buffer, async (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to save file' });
                    }

                    const updateOrderQuery = `
                        UPDATE 
                            orders 
                        SET 
                            orderReceipt = ?
                        WHERE 
                            order_id = ?`;
                    await connection.execute(updateOrderQuery, [filename, order_id]);

                    await connection.commit();
                    res.status(200).json({ message: "Receipt upload success" });
                });
            } else {
                res.status(400).json({ error: 'No receipt file uploaded' });
            }
        } catch (error) {
            await connection.rollback();
            console.error('Error uploading receipt:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete("/order/:id", authenticateToken, async (req, res) => {
    let order_id = req.params.id;

    if (!order_id) {
        return res
        .status(400)
        .send({ error: true, message: "Please provide order_id" });
    }

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            await connection.execute("DELETE FROM orders WHERE order_id = ?", [order_id]);

            await connection.commit();
            res.status(200).json({ message: "Order deleted successfully" });
        } catch (error) {
            await connection.rollback();
            console.error("Error deleting order:", error);
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