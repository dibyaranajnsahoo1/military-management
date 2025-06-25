const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// ✅ Updated CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server requests or non-browser tools
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'https://military-management-chi.vercel.app' // ✅ Correct origin with https
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ✅ Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Military Management Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ MongoDB Connection Function
const connectDB = async () => {
  if (mongoose.connections[0].readyState === 1) {
    return mongoose.connections[0];
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log('✅ Connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// ✅ Connect to DB before all routes
app.use(async (req, res, next) => {
  try {
    if (mongoose.connections[0].readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({ 
      message: 'Database connection failed', 
      error: error.message 
    });
  }
});

// ✅ API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/purchases', require('./routes/purchase.routes'));
app.use('/api/transfers', require('./routes/transfer.routes'));
app.use('/api/assignments', require('./routes/assignment.routes'));
app.use('/api/expenditures', require('./routes/expenditure.routes'));

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ✅ Server Listener (Only for local/dev use)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🧩 MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
  });
}

// ✅ Export app for deployment platforms like Render
module.exports = app;
