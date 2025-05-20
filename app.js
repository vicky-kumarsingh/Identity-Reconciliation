require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const identifyRoutes = require('./routes/identify');

const app = express();

app.use(express.json());

app.use('/', identifyRoutes);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
