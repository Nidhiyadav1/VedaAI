import { Worker, Job } from 'bullmq';
import { redisForBull } from '../config/redis';
import { generateQuestionPaper } from '../services/aiService';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { getIO } from '../config/socket';

export const startWorker = () => {
  const worker = new Worker(
    'assignment-generation',
    async (job: Job) => {
      const { assignmentId } = job.data;
      console.log(`\n🔧 Processing job for assignment: ${assignmentId}`);

      // Mark as processing
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
      
      // Notify frontend
      try { getIO().to(assignmentId).emit('status', { status: 'processing' }); } catch {}

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error('Assignment not found');

      // Generate paper using AI
      const paperData = await generateQuestionPaper(
        assignment.questionTypes as any,
        assignment.additionalInstructions || '',
        assignment.uploadedFileText || ''
      );

      // Save to MongoDB
      const paper = await GeneratedPaper.create({
        assignmentId: assignment._id,
        ...paperData,
      });

      // Mark as done
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'done' });

      // Notify frontend — paper ready!
      try {
        getIO().to(assignmentId).emit('status', {
          status: 'done',
          paperId: paper._id.toString(),
        });
      } catch {}

      console.log(`✅ Paper generated for assignment: ${assignmentId}`);
      return { paperId: paper._id };
    },
    {
      connection: redisForBull,
      concurrency: 3,
    }
  );

  worker.on('failed', async (job, err) => {
    console.error(`❌ Job failed:`, err.message);
    if (job) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, { status: 'failed' });
      try { getIO().to(job.data.assignmentId).emit('status', { status: 'failed' }); } catch {}
    }
  });

  console.log('⚙️  BullMQ Worker started');
  return worker;
};