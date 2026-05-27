import mongoose, { Schema } from 'mongoose';

const QuestionSchema = new Schema({
  text: String,
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Hard'],
    default: 'Easy'
  },
  marks: Number,
});

const SectionSchema = new Schema({
  title: String,
  instruction: String,
  questions: [QuestionSchema],
});

const PaperSchema = new Schema({
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  schoolName: { type: String, default: 'Delhi Public School' },
  subject: String,
  className: String,
  timeAllowed: String,
  maxMarks: Number,
  sections: [SectionSchema],
  answerKey: [String],
}, { timestamps: true });

export const GeneratedPaper = mongoose.model('GeneratedPaper', PaperSchema);