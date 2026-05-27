import { Queue } from 'bullmq';
import { redisForBull } from '../config/redis';

export const assignmentQueue = new Queue('assignment-generation', {
  connection: redisForBull,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  }
});

console.log('📋 BullMQ Queue initialized');