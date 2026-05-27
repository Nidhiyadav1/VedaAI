import mongoose, { Schema } from 'mongoose';

const QuestionTypeSchema = new Schema({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema({
  dueDate: { type: String, required: true },
  questionTypes: [QuestionTypeSchema],
  additionalInstructions: { type: String, default: '' },
  uploadedFileText: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'done', 'failed'],
    default: 'pending'
  },
  jobId: { type: String, default: '' },
}, { timestamps: true });

export const Assignment = mongoose.model('Assignment', AssignmentSchema);