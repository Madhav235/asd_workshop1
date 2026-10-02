// app.js
const express = require('express');
const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(express.json());

// Mounting product routes
app.use('/products', productRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode
    }
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Express application running on port ${PORT}`);
  });
}

module.exports = app;
