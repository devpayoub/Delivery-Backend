import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import employerRoutes from './routes/employers.js';
import driverRoutes from './routes/drivers.js';
import cityRoutes from './routes/cities.js';
import productTypeRoutes from './routes/productTypes.js';
import deliveryRoutes from './routes/deliveries.js';
import logRoutes from './routes/logs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/product-types', productTypeRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Delivery API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});