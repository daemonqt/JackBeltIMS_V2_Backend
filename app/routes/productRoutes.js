const express = require('express');
const router = express.Router();
const connection = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');
const multer = require('multer');
const path = require("path");
const fs = require("fs");

const storage = multer.memoryStorage();
const uploadProductImage = multer({ storage });

function generateRandomNumber(length) {
  let randomNumber = "";
  for (let i = 0; i < length; i++) {
    randomNumber += Math.floor(Math.random() * 10);
  }
  return randomNumber;
}

router.post('/product/register', authenticateToken, uploadProductImage.single('productImage'), async (req, res) => {
    let db;

    try {
        db = await connection();
        const { productType, productName, productVariant, productQuantity, productPrice } = req.body;

        const quantity = Number(productQuantity);
        const price = Number(productPrice);
        if (isNaN(quantity) || quantity < 0) {
            return res.status(400).json({ error: 'Product quantity must be a number greater than or equal to zero.' });
        }
        if (isNaN(price) || price < 0) {
            return res.status(400).json({ error: 'Product price must be a number greater than or equal to zero.' });
        }

        const randomDigits = generateRandomNumber(10);
        const productCode = `PROD-${randomDigits}`;

        const checkProductCodeQuery = 'SELECT * FROM products WHERE productCode = ?';
        const checkProductVariantQuery = 'SELECT * FROM products WHERE productVariant = ?';
        const [existingProductCode] = await db.execute(checkProductCodeQuery, [productCode]);
        const [existingProductVariant] = await db.execute(checkProductVariantQuery, [productVariant]);

        if (existingProductCode.length > 0) {
            return res.status(409).json({ message: 'Product code already exists' });
        }
        if (existingProductVariant.length > 0) {
            return res.status(409).json({ message: 'Product variant already exists' });
        }

        const renameProductVariant = req.body.productVariant ? req.body.productVariant.replace(/[^a-zA-Z0-9]/g, '') : 'default';
        let productImage = null;

        if (req.file) {
            const extension = path.extname(req.file.originalname);
            const filename = `${renameProductVariant}_${Date.now()}${extension}`;
            const dir = path.join(__dirname, "../files/product-images/");
            const filePath = path.join(dir, filename);

            fs.writeFile(filePath, req.file.buffer, async (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save file' });
                }
                productImage = filename;

                const insertProductQuery = `
                    INSERT INTO products (
                        productType, 
                        productCode,
                        productImage, 
                        productName, 
                        productVariant, 
                        productQuantity, 
                        productPrice,
                        priceAdjustment
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'NONE')
                `;
                const [AddProductResult] = await db.execute(insertProductQuery, [
                    productType,
                    productCode,
                    productImage, 
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
                await db.execute(insertPriceHistoryQuery, [product_id, productPrice]);

                return res.status(201).json({ message: 'Product registered successfully' });
            });
        } else {
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
            const [AddProductResult] = await db.execute(insertProductQuery, [
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
            await db.execute(insertPriceHistoryQuery, [product_id, productPrice]);

            return res.status(201).json({ message: 'Product registered successfully' });
        }
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get("/products", authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
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
            ORDER BY 
                timestamp_update DESC
        `);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get("/products-orderview", authenticateToken, async (req, res) => {
    let db;
    try {
        db = await connection();
        const [results] = await db.execute(`
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
            ORDER BY 
                productType DESC, 
                CAST(SUBSTRING_INDEX(productVariant, '"', 1) AS UNSIGNED) ASC
        `);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.get("/product/:id", authenticateToken, async (req, res) => {
    let product_id = req.params.id;
    let db;
    if (!product_id) {
        return req
        .status(400)
        .send({ error: true, message: "Please provide product_id" });
    }

    try {
        db = await connection();
        const [results] = await db.execute(
          `
            SELECT 
                p.product_id, 
                p.productType, 
                p.productCode, 
                p.productImage, 
                p.productName, 
                p.productVariant, 
                p.productQuantity, 
                p.productPrice,
                p.priceAdjustment,
                ph.priceHistory,
                DATE_FORMAT(ph.timestamp_create, '%m/%d/%Y %h:%i %p') AS timestamp_create
            FROM 
                products p
            JOIN 
                price_history ph ON p.product_id = ph.product_id
            WHERE 
                p.product_id = ?
            ORDER BY 
                ph.timestamp_create DESC;
            `,
          [product_id]
        );
        res.status(200).json(results);
    } catch (error) {
        console.error("Error loading product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.put('/product/:id', authenticateToken, uploadProductImage.single('productImage'), async (req, res) => {
    let product_id = req.params.id;
    let db;

    const { productQuantity, productPrice } = req.body;
    const productImage = req.file ? req.file : null;

    if (productQuantity === undefined || productPrice === undefined) {
        return res.status(400).send({ error: true, message: 'Please provide productQuantity, and productPrice' });
    }

    const quantity = Number(productQuantity);
    const price = Number(productPrice);
    if (isNaN(quantity) || productQuantity === '' || productQuantity === null || quantity < 0) {
        return res.status(400).json({ error: 'Product quantity must be a number greater than or equal to zero.' });
    }
    if (isNaN(price) || productPrice === '' || productPrice === null || price < 0) {
        return res.status(400).json({ error: 'Product price must be a number greater than or equal to zero.' });
    }

    try {
        db = await connection();

        const fetchProductQuery = `
            SELECT 
                productPrice,
                productVariant,
                priceAdjustment,
                productImage
            FROM 
                products 
            WHERE 
                product_id = ?`;
        const [currentProduct] = await db.execute(fetchProductQuery, [product_id]);
        if (currentProduct.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const currentPrice = currentProduct[0].productPrice;
        const currentPriceAdjustment = currentProduct[0].priceAdjustment;
        const currentImage = currentProduct[0].productImage;
        let productVariant = currentProduct[0].productVariant;
        let priceAdjustment = currentPriceAdjustment;

        if (currentPrice !== productPrice) {
            priceAdjustment = 'NEW';

            const insertPriceHistoryQuery = `
                INSERT INTO price_history (
                    product_id,
                    priceHistory
                ) VALUES (?, ?)
            `;
            await db.execute(insertPriceHistoryQuery, [
                product_id,
                productPrice
            ]);
        }

        if (productImage) {
            const renameProductVariant = productVariant.replace(/[^a-zA-Z0-9]/g, '');
            const extension = path.extname(req.file.originalname);
            const filename = `${renameProductVariant}_${Date.now()}${extension}`;
            const dir = path.join(__dirname, "../files/product-images/");
            const filePath = path.join(dir, filename);

            if (currentImage) {
                const currentImagePath = path.join(dir, currentImage);
                fs.unlink(currentImagePath, (err) => {
                    if (err) {
                        console.error('Failed to delete existing image:', err);
                    }
                });
            }
            
            fs.writeFile(filePath, req.file.buffer, async (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save file' });
                }

                const updateProductQuery = `
                    UPDATE 
                        products 
                    SET 
                        productQuantity = ?, 
                        productPrice = ?,
                        priceAdjustment = ?,
                        productImage = ?,
                        timestamp_update = NOW()
                    WHERE 
                        product_id = ?`;
                await db.execute(updateProductQuery, [
                    productQuantity,
                    price,
                    priceAdjustment,
                    filename,
                    product_id
                ]);

                res.status(200).json({ message: 'Product updated successfully' });
            });
        } else {
            const updateProductQuery = `
                UPDATE 
                    products 
                SET 
                    productQuantity = ?, 
                    productPrice = ?,
                    priceAdjustment = ?,
                    timestamp_update = NOW()
                WHERE 
                    product_id = ?`;
            await db.execute(updateProductQuery, [
                productQuantity,
                price,
                priceAdjustment,
                product_id
            ]);

            res.status(200).json({ message: 'Product updated successfully' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (db) {
            db.release();
        }
    }
});

router.delete("/product/:id", authenticateToken, async (req, res) => {
    let product_id = req.params.id;
    let db;

    if (!product_id) {
        return res
        .status(400)
        .send({ error: true, message: "Please provide product_id" });
    }

    try {
        db = await connection();
        await db.execute("DELETE FROM products WHERE product_id = ?", [product_id]);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (db) {
            db.release();
        }
    }
});

module.exports = router;