import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';

import { connectDB } from './config/db';
import { redis, redisForBull } from './config/redis';
import { initSocket } from './config/socket';
import { startWorker } from './workers/assignmentWorker';
import assignmentRoutes from './routes/assignments';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/assignments', assignmentRoutes);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

const startServer = async () => {
  await connectDB();

  // Connect Redis only if not already connected
  try {
    if (redis.status !== 'ready') await redis.connect();
  } catch { /* already connected */ }

  try {
    if (redisForBull.status !== 'ready') await redisForBull.connect();
  } catch { /* already connected */ }

  initSocket(server);
  startWorker();

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`\n🚀 VedaAI Backend running at http://localhost:${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`✅ Ready to receive requests!\n`);
  });
};

startServer().catch(console.error);