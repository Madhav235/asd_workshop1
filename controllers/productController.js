// controllers/productController.js
const productService = require('../services/productService');

/**
 * Controller layer handling HTTP requests and responses.
 */
class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const products = await productService.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const newProduct = await productService.createProduct(req.body);
      res.status(201).json(newProduct);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updatedProduct = await productService.updateProduct(id, req.body);
      res.status(200).json(updatedProduct);
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await productService.deleteProduct(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
