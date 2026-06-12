/**
 * Socket.io Chat Handler — Real-time expense comments.
 *
 * Events:
 * - Client emits 'join-expense' with { expenseId } to join a room
 * - Client emits 'leave-expense' with { expenseId } to leave a room
 * - Client emits 'new-comment' with { expenseId, content }
 * - Server broadcasts 'comment-added' with the new comment to the room
 */

const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

function setupSocket(io) {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user.id})`);

    // Join an expense chat room
    socket.on('join-expense', ({ expenseId }) => {
      if (expenseId) {
        socket.join(`expense:${expenseId}`);
        console.log(`${socket.user.name} joined expense:${expenseId}`);
      }
    });

    // Leave an expense chat room
    socket.on('leave-expense', ({ expenseId }) => {
      if (expenseId) {
        socket.leave(`expense:${expenseId}`);
        console.log(`${socket.user.name} left expense:${expenseId}`);
      }
    });

    // Handle new comment
    socket.on('new-comment', async ({ expenseId, content }) => {
      try {
        if (!expenseId || !content?.trim()) return;

        // Verify the expense exists and user is a group member
        const expense = await prisma.expense.findUnique({
          where: { id: expenseId },
        });

        if (!expense) return;

        const membership = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: { groupId: expense.groupId, userId: socket.user.id },
          },
        });

        if (!membership) return;

        // Save comment to DB
        const comment = await prisma.expenseComment.create({
          data: {
            expenseId,
            userId: socket.user.id,
            content: content.trim(),
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Broadcast to all users in the expense room (including sender)
        io.to(`expense:${expenseId}`).emit('comment-added', comment);
      } catch (err) {
        console.error('Error handling new-comment:', err.message);
        socket.emit('error', { message: 'Failed to send comment' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
}

module.exports = setupSocket;
