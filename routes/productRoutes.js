// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/cacheMiddleware');

/**
 * Product Routes layer.
 * Flow: Route -> Middleware -> Controller -> Service -> Database
 */

// GET /products - Cached endpoint
router.get('/', cacheMiddleware, (req, res, next) => productController.getAllProducts(req, res, next));

// GET /products/:id - Cached endpoint
router.get('/:id', cacheMiddleware, (req, res, next) => productController.getProductById(req, res, next));

// POST /products - Invalidates cache on successful creation
router.post('/', invalidateCacheMiddleware, (req, res, next) => productController.createProduct(req, res, next));

// PUT /products/:id - Invalidates cache on successful update
router.put('/:id', invalidateCacheMiddleware, (req, res, next) => productController.updateProduct(req, res, next));

// PATCH /products/:id - Invalidates cache on successful patch
router.patch('/:id', invalidateCacheMiddleware, (req, res, next) => productController.updateProduct(req, res, next));

// DELETE /products/:id - Invalidates cache on successful deletion
router.delete('/:id', invalidateCacheMiddleware, (req, res, next) => productController.deleteProduct(req, res, next));

module.exports = router;
