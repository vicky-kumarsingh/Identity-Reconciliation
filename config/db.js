const { sequelize } = require('../models');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync(); // Sync models with DB (creates tables if not exist)
  } catch (err) {
    console.error('Database connection error:', err);
  }
};

module.exports = connectDB;
