/**
 * HTTP API Server for MCP integration
 *
 * This server exposes HTTP endpoints that the main backend can use
 * to add messages to the queue and retrieve responses processed by Claude MAX.
 *
 * Architecture:
 * 1. Backend receives user message
 * 2. Backend calls POST /messages to add to queue
 * 3. Claude Desktop (with MAX plan) processes messages using MCP tools
 * 4. Backend polls GET /responses/:id to get the AI response
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (use Redis/DB in production)
interface PendingMessage {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  timestamp: Date;
  conversationHistory: string[];
  status: 'pending' | 'processing' | 'completed';
}

interface ProcessedResponse {
  response: string;
  suggestedActions: string[];
  processedAt: Date;
}

const pendingMessages: Map<string, PendingMessage> = new Map();
const processedResponses: Map<string, ProcessedResponse> = new Map();

// Generate unique ID
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Add new message to queue
app.post('/messages', (req, res) => {
  const { userId, userEmail, message, conversationHistory = [] } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  const id = generateId();
  const newMessage: PendingMessage = {
    id,
    userId,
    userEmail: userEmail || 'anonymous@user.com',
    message,
    timestamp: new Date(),
    conversationHistory,
    status: 'pending',
  };

  pendingMessages.set(id, newMessage);

  res.json({
    success: true,
    data: {
      messageId: id,
      status: 'pending',
    },
  });
});

// Get pending messages (for MCP polling or admin dashboard)
app.get('/messages/pending', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const messages = Array.from(pendingMessages.values())
    .filter((m) => m.status === 'pending')
    .slice(0, limit)
    .map((m) => ({
      id: m.id,
      userId: m.userId,
      userEmail: m.userEmail,
      message: m.message,
      timestamp: m.timestamp,
      historyLength: m.conversationHistory.length,
    }));

  res.json({
    success: true,
    data: {
      messages,
      count: messages.length,
    },
  });
});

// Get single message details
app.get('/messages/:id', (req, res) => {
  const message = pendingMessages.get(req.params.id);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  res.json({
    success: true,
    data: message,
  });
});

// Submit response for a message (called by MCP or admin)
app.post('/messages/:id/respond', (req, res) => {
  const { response, suggestedActions = [] } = req.body;
  const messageId = req.params.id;

  const message = pendingMessages.get(messageId);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (!response) {
    return res.status(400).json({ error: 'response is required' });
  }

  // Store response
  processedResponses.set(messageId, {
    response,
    suggestedActions,
    processedAt: new Date(),
  });

  // Update message status
  message.status = 'completed';
  pendingMessages.set(messageId, message);

  res.json({
    success: true,
    message: 'Response submitted',
  });
});

// Get response for a message (polled by backend)
app.get('/responses/:id', (req, res) => {
  const messageId = req.params.id;
  const response = processedResponses.get(messageId);

  if (!response) {
    // Check if message exists and is still pending
    const message = pendingMessages.get(messageId);
    if (message) {
      return res.json({
        success: true,
        data: {
          status: message.status,
          response: null,
        },
      });
    }
    return res.status(404).json({ error: 'Message not found' });
  }

  // Return and optionally clean up
  const deleteAfterRead = req.query.delete === 'true';
  if (deleteAfterRead) {
    processedResponses.delete(messageId);
    pendingMessages.delete(messageId);
  }

  res.json({
    success: true,
    data: {
      status: 'completed',
      response: response.response,
      suggestedActions: response.suggestedActions,
      processedAt: response.processedAt,
    },
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const pending = Array.from(pendingMessages.values()).filter(
    (m) => m.status === 'pending'
  ).length;
  const processing = Array.from(pendingMessages.values()).filter(
    (m) => m.status === 'processing'
  ).length;
  const completed = Array.from(pendingMessages.values()).filter(
    (m) => m.status === 'completed'
  ).length;
  const responsesReady = processedResponses.size;

  res.json({
    success: true,
    data: {
      pending,
      processing,
      completed,
      responsesReady,
      totalMessages: pendingMessages.size,
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.MCP_API_PORT || 3002;

app.listen(PORT, () => {
  console.log(`MCP API Server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /messages - Add message to queue');
  console.log('  GET /messages/pending - Get pending messages');
  console.log('  GET /messages/:id - Get message details');
  console.log('  POST /messages/:id/respond - Submit response');
  console.log('  GET /responses/:id - Get response for message');
  console.log('  GET /stats - Get queue statistics');
});

export default app;
