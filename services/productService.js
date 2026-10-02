// services/productService.js
const db = require('../database/db');

/**
 * Service layer containing business logic and invoking database operations.
 */
class ProductService {
  async getAllProducts() {
    return await db.findAll();
  }

  async getProductById(id) {
    const product = await db.findById(id);
    if (!product) {
      const error = new Error(`Product with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async createProduct(productData) {
    if (!productData || !productData.name || productData.price == null) {
      const error = new Error("Name and price are required");
      error.statusCode = 400;
      throw error;
    }
    return await db.create(productData);
  }

  async updateProduct(id, productData) {
    const updated = await db.update(id, productData);
    if (!updated) {
      const error = new Error(`Product with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  async deleteProduct(id) {
    const deleted = await db.delete(id);
    if (!deleted) {
      const error = new Error(`Product with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return { message: `Product with ID ${id} successfully deleted` };
  }
}

module.exports = new ProductService();
