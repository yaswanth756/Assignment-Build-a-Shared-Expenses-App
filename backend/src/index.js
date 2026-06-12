/**
 * SplitBuddy Backend — Main Entry Point
 *
 * Express.js + Socket.io server for the Splitwise clone.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const { expenseDetailRouter } = require('./routes/expenses');
const { groupBalanceRouter, overallBalanceRouter } = require('./routes/balances');
const settlementRoutes = require('./routes/settlements');
const setupSocket = require('./socket/chat');

// Import middleware
const auth = require('./middleware/auth');
const prisma = require('./config/db');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Setup Socket.io handlers
setupSocket(io);

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SplitBuddy API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────

// Auth
app.use('/api/auth', authRoutes);

// User search
app.get('/api/users/search', auth, async (req, res) => {
  const { email, q } = req.query;

  if (!email && !q) {
    return res.status(400).json({
      success: false,
      message: 'Provide email or q (search query) parameter.',
    });
  }

  const searchTerm = email || q;

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: searchTerm.toLowerCase(), mode: 'insensitive' } },
        { name: { contains: searchTerm, mode: 'insensitive' } },
      ],
      NOT: { id: req.user.id }, // Exclude self
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 10,
  });

  res.json({ success: true, data: { users } });
});

// Groups
app.use('/api/groups', groupRoutes);

// Expenses (nested under groups)
app.use('/api/groups/:groupId/expenses', expenseRoutes);

// Expense details (standalone)
app.use('/api/expenses', expenseDetailRouter);

// Balances
app.use('/api/groups/:id/balances', groupBalanceRouter);
app.use('/api/balances', overallBalanceRouter);

// Settlements
app.use('/api/groups/:groupId/settlements', settlementRoutes);

// ─── Error Handling ───────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'Internal server error. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🍷 SplitBuddy API Server            ║
  ║     Running on port ${PORT}                 ║
  ║     Environment: ${process.env.NODE_ENV || 'development'}          ║
  ╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = { app, server };
