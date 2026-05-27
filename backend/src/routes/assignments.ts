import express from 'express';
import multer from 'multer';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { assignmentQueue } from '../queues/assignmentQueue';
import { redis } from '../config/redis';

const pdfParse = require('pdf-parse');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

// POST /api/assignments — Create new assignment
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { dueDate, questionTypes, additionalInstructions } = req.body;

    if (!dueDate) {
      return res.status(400).json({ error: 'Due date is required' });
    }
    if (!questionTypes) {
      return res.status(400).json({ error: 'Question types are required' });
    }

    const parsedQTypes = JSON.parse(questionTypes);
    if (!Array.isArray(parsedQTypes) || parsedQTypes.length === 0) {
      return res.status(400).json({ error: 'At least one question type required' });
    }

    for (const qt of parsedQTypes) {
      if (!qt.type || qt.count < 1 || qt.marks < 1) {
        return res.status(400).json({ error: 'Invalid question type values' });
      }
    }

    let fileText = '';
    if (req.file) {
      const parsed = await pdfParse(req.file.buffer);
      fileText = parsed.text.slice(0, 3000);
      console.log(`📄 PDF text extracted: ${fileText.length} chars`);
    }

    const assignment = await Assignment.create({
      dueDate,
      questionTypes: parsedQTypes,
      additionalInstructions: additionalInstructions || '',
      uploadedFileText: fileText,
      status: 'pending',
    });

    const job = await assignmentQueue.add(
      'generate',
      { assignmentId: assignment._id.toString() },
      { delay: 0 }
    );

    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });

    console.log(`📥 Assignment created: ${assignment._id}, Job: ${job.id}`);
    res.status(201).json({
      assignmentId: assignment._id,
      jobId: job.id,
      message: 'Assignment created, generation started'
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Create assignment error:', message);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// GET /api/assignments — List all assignments
router.get('/', async (_, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 }).limit(50);
    res.json(assignments);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Fetch assignments error:', message);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// GET /api/assignments/:id — Get single assignment
router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Fetch assignment error:', message);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// GET /api/assignments/:id/paper — Get generated paper with Redis cache
router.get('/:id/paper', async (req, res) => {
  try {
    const cacheKey = `paper:${req.params.id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`⚡ Cache hit for paper: ${req.params.id}`);
      return res.json(JSON.parse(cached));
    }

    const paper = await GeneratedPaper.findOne({ assignmentId: req.params.id });
    if (!paper) {
      return res.status(404).json({ error: 'Paper not generated yet' });
    }

    await redis.setex(cacheKey, 3600, JSON.stringify(paper));
    console.log(`💾 Paper cached: ${req.params.id}`);
    res.json(paper);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Fetch paper error:', message);
    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

// DELETE /api/assignments/:id — Delete assignment + paper + cache
router.delete('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Delete generated paper
    await GeneratedPaper.deleteOne({ assignmentId: req.params.id });

    // Clear Redis cache
    await redis.del(`paper:${req.params.id}`);

    console.log(`🗑️ Assignment deleted: ${req.params.id}`);
    res.json({ message: 'Assignment deleted successfully' });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Delete assignment error:', message);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;