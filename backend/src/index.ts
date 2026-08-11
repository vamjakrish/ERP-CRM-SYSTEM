import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import movementRoutes from './routes/movements';
import challanRoutes from './routes/challans';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/movements', movementRoutes);
app.use('/challans', challanRoutes);

// Base route for healthcheck
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Mini ERP + CRM Operations API is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server (only if not running tests)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
