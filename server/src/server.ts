import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { initSocketManager } from './sockets/socket.manager';
import { storageService } from './services/storage.service';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded PDF files securely
const uploadsPath = storageService.getFilePath('');
app.use('/uploads', express.static(uploadsPath));

// Mount REST APIs
app.use('/api', routes);

// Base Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'LeopardX Xerox Server', timestamp: new Date().toISOString() });
});

// Central Error Handler
app.use(errorHandler);

// Initialize Socket.IO Manager
initSocketManager(server, CLIENT_URL);

server.listen(PORT, () => {
  const isSimulation = process.env.PRINT_SIMULATION_MODE !== 'false';
  const cfEnv = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();
  const cfReturnUrl = process.env.CASHFREE_RETURN_URL || '(Not set - using CLIENT_URL fallback)';
  console.log(`==================================================`);
  console.log(`🐆 LeopardX Xerox Server running on port ${PORT}`);
  console.log(`📁 Static storage path: ${uploadsPath}`);
  console.log(`⚡ Socket.IO initialized for Print Agent & Kiosk Client`);
  console.log(`💳 Cashfree Gateway Environment: ${cfEnv}`);
  console.log(`🔗 Cashfree Return URL Configured: ${cfReturnUrl}`);
  console.log(`🧪 Print Simulation Mode: ${isSimulation ? 'ENABLED (true)' : 'DISABLED (false)'}`);
  console.log(`==================================================`);
});
