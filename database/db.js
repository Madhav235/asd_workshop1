// database/db.js

/**
 * In-memory database module simulating asynchronous database operations.
 */
let products = [
  { id: 1, name: "Laptop", price: 999.99, category: "Electronics" },
  { id: 2, name: "Smartphone", price: 699.99, category: "Electronics" },
  { id: 3, name: "Headphones", price: 149.99, category: "Audio" }
];

let nextId = 4;

const productDatabase = {
  async findAll() {
    return JSON.parse(JSON.stringify(products));
  },

  async findById(id) {
    const numericId = Number(id);
    const product = products.find(p => p.id === numericId);
    return product ? JSON.parse(JSON.stringify(product)) : null;
  },

  async create(data) {
    const newProduct = {
      id: nextId++,
      name: data.name,
      price: Number(data.price),
      category: data.category || "General"
    };
    products.push(newProduct);
    return JSON.parse(JSON.stringify(newProduct));
  },

  async update(id, data) {
    const numericId = Number(id);
    const index = products.findIndex(p => p.id === numericId);
    if (index === -1) return null;

    products[index] = {
      id: numericId,
      name: data.name !== undefined ? data.name : products[index].name,
      price: data.price !== undefined ? Number(data.price) : products[index].price,
      category: data.category !== undefined ? data.category : products[index].category
    };
    return JSON.parse(JSON.stringify(products[index]));
  },

  async delete(id) {
    const numericId = Number(id);
    const index = products.findIndex(p => p.id === numericId);
    if (index === -1) return false;

    products.splice(index, 1);
    return true;
  },

  async reset() {
    products = [
      { id: 1, name: "Laptop", price: 999.99, category: "Electronics" },
      { id: 2, name: "Smartphone", price: 699.99, category: "Electronics" },
      { id: 3, name: "Headphones", price: 149.99, category: "Audio" }
    ];
    nextId = 4;
  }
};

module.exports = productDatabase;
