import express from 'express';
import cors from 'cors';
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

// CORS middleware
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: '50mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug test endpoint
app.post('/api/test', (req, res) => {
  console.log('Test body:', req.body);
  res.json({ received: req.body });
});

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