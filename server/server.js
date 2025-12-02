import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bookingRoutes from './routes/bookings.js';
import driverRoutes from './routes/drivers.js';
import vehicleRoutes from './routes/vehicles.js';
import packageRoutes from './routes/packages.js';
import paymentRoutes from './routes/payments.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications_simple.js';
import settingsRoutes from './routes/settings.js';

// Customer API routes
import customerAuthRoutes from './routes/customer/auth.js';
import customerBookingRoutes from './routes/customer/bookings.js';
import customerProfileRoutes from './routes/customer/profile.js';
import customerPaymentRoutes from './routes/customer/payments.js';
import customerSupportRoutes from './routes/customer/support.js';
import customerTripRoutes from './routes/customer/trips.js';
import customerPromotionsRoutes from './routes/customer/promotions.js';
import customerFavoritesRoutes from './routes/customer/favorites.js';
import customerNotificationsRoutes from './routes/customer/notifications.js';
import customerSearchRoutes from './routes/customer/search.js';

// Driver API routes
import driverAuthRoutes from './routes/driver/auth.js';
import driverDashboardRoutes from './routes/driver/dashboard.js';
import driverTripRoutes from './routes/driver/trips.js';
import driverProfileRoutes from './routes/driver/profile.js';
import driverEarningsRoutes from './routes/driver/earnings.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Allow localhost on any port for development
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('https://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('https://127.0.0.1:')) {
        return callback(null, true);
      }
      
      // For development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://127.0.0.1:') ||
        origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    
    // Allow production origins
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // For legacy browser support
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded documents)
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_travels_admin')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('Admin user connected:', socket.id);
  
  socket.on('join_admin_room', (adminId) => {
    socket.join(`admin_${adminId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Admin user disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Admin Routes
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/bookings', bookingRoutes);
app.use('/api/admin/drivers', driverRoutes);
app.use('/api/admin/vehicles', vehicleRoutes);
app.use('/api/admin/packages', packageRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin/settings', settingsRoutes);

// Customer API Routes
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/customer/bookings', customerBookingRoutes);
app.use('/api/customer/profile', customerProfileRoutes);
app.use('/api/customer/payments', customerPaymentRoutes);
app.use('/api/customer/support', customerSupportRoutes);
app.use('/api/customer/trips', customerTripRoutes);
app.use('/api/customer/promotions', customerPromotionsRoutes);
app.use('/api/customer/favorites', customerFavoritesRoutes);
app.use('/api/customer/notifications', customerNotificationsRoutes);
app.use('/api/customer/search', customerSearchRoutes);

// Driver API Routes
app.use('/api/driver/auth', driverAuthRoutes);
app.use('/api/driver/dashboard', driverDashboardRoutes);
app.use('/api/driver/trips', driverTripRoutes);
app.use('/api/driver/profile', driverProfileRoutes);
app.use('/api/driver/earnings', driverEarningsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;