'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { createAssignment } from '@/lib/api';
import { X, Plus, Upload, Mic } from 'lucide-react';

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Questions',
];

export default function NewAssignmentPage() {
  const router = useRouter();
  const store = useAssignmentStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async () => {
    if (!store.dueDate) return setError('Please set a due date');
    if (store.questionTypes.length === 0) return setError('Add at least one question type');
    for (const qt of store.questionTypes) {
      if (!qt.type) return setError('Select a question type for all rows');
      if (qt.count < 1) return setError('Number of questions must be at least 1');
      if (qt.marks < 1) return setError('Marks must be at least 1');
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('dueDate', store.dueDate);
      formData.append('questionTypes', JSON.stringify(store.questionTypes));
      formData.append('additionalInstructions', store.additionalInstructions);
      if (store.file) formData.append('file', store.file);

      const { assignmentId } = await createAssignment(formData);
      store.reset();
      router.push(`/assignments/${assignmentId}`);
    } catch {
      setError('Failed to create assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ←
        </button>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h1 className="text-xl font-bold text-gray-900">Create Assignment</h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Set up a new assignment for your students
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-orange-500 h-1 rounded-full w-1/2"></div>
        </div>

        <h2 className="font-semibold text-gray-900">Assignment Details</h2>

        {/* File Upload */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file?.type === 'application/pdf') store.setFile(file);
          }}
        >
          <Upload size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-900 font-medium mb-1">
            {store.file ? `📄 ${store.file.name}` : 'Choose a file or drag & drop it here'}
          </p>
          <p className="text-xs text-gray-500 mb-3">JPEG, PNG and PDF up to 10MB</p>
          <label className="cursor-pointer">
            <span className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 font-medium hover:bg-gray-50 bg-white">
              Browse Files
            </span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => store.setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Due Date
          </label>
          <input
            type="date"
            value={store.dueDate}
            onChange={(e) => store.setDueDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Question Types */}
        <div>
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700 mb-3 px-1">
            <span className="col-span-6">Question Type</span>
            <span className="col-span-3 text-center">No. of Questions</span>
            <span className="col-span-2 text-center">Marks</span>
            <span className="col-span-1"></span>
          </div>

          <div className="space-y-3">
            {store.questionTypes.map((qt, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                {/* Question Type Select */}
                <div className="col-span-6">
                  <select
                    value={qt.type}
                    onChange={(e) => store.updateQuestionType(i, 'type', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    {QUESTION_TYPES.map(t => (
                      <option key={t} value={t} className="text-gray-900">{t}</option>
                    ))}
                  </select>
                </div>

                {/* Count */}
                <div className="col-span-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => store.updateQuestionType(i, 'count', Math.max(1, qt.count - 1))}
                    className="w-7 h-7 rounded border border-gray-300 text-gray-900 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                  >
                    −
                  </button>
                  <span className="text-sm w-6 text-center font-bold text-gray-900">
                    {qt.count}
                  </span>
                  <button
                    onClick={() => store.updateQuestionType(i, 'count', qt.count + 1)}
                    className="w-7 h-7 rounded border border-gray-300 text-gray-900 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Marks */}
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <button
                    onClick={() => store.updateQuestionType(i, 'marks', Math.max(1, qt.marks - 1))}
                    className="w-7 h-7 rounded border border-gray-300 text-gray-900 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                  >
                    −
                  </button>
                  <span className="text-sm w-6 text-center font-bold text-gray-900">
                    {qt.marks}
                  </span>
                  <button
                    onClick={() => store.updateQuestionType(i, 'marks', qt.marks + 1)}
                    className="w-7 h-7 rounded border border-gray-300 text-gray-900 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => store.removeQuestionType(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Question Type */}
          <button
            onClick={store.addQuestionType}
            className="mt-4 flex items-center gap-2 text-sm text-gray-700 font-medium hover:text-orange-500 transition-colors"
          >
            <Plus size={16} /> Add Question Type
          </button>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-8 text-sm text-gray-700">
            <span>
              Total Questions:{' '}
              <strong className="text-gray-900">{store.getTotalQuestions()}</strong>
            </span>
            <span>
              Total Marks:{' '}
              <strong className="text-gray-900">{store.getTotalMarks()}</strong>
            </span>
          </div>
        </div>

        {/* Additional Instructions */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Additional Information (For better output)
          </label>
          <div className="relative">
            <textarea
              value={store.additionalInstructions}
              onChange={(e) => store.setAdditionalInstructions(e.target.value)}
              placeholder="e.g. Generate a question paper for 3 hour exam duration..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none pr-10"
            />
            <Mic size={16} className="absolute right-3 bottom-3 text-gray-400" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 font-medium">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between pt-2">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium hover:bg-gray-50"
          >
            ← Previous
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Next →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}