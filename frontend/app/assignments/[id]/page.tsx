'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { fetchPaper } from '@/lib/api';
import { Download, RefreshCw, ArrowLeft } from 'lucide-react';

interface Question {
  text: string;
  difficulty: string;
  marks: number;
}

interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

interface Paper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: Section[];
  answerKey: string[];
}

export default function PaperOutputPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'processing' | 'done' | 'failed'>('pending');
  const [paper, setPaper] = useState<Paper | null>(null);

  useEffect(() => {
    const loadPaper = async () => {
      try {
        const data = await fetchPaper(id);
        setPaper(data);
        setStatus('done');
      } catch {
        // Not ready yet
      }
    };

    const init = async () => {
      await loadPaper();
      const socket = getSocket();
      socket.emit('join', id);
      socket.on('status', async (data: { status: string }) => {
        setStatus(data.status as 'pending' | 'processing' | 'done' | 'failed');
        if (data.status === 'done') await loadPaper();
      });
    };

    init();

    return () => {
      const socket = getSocket();
      socket.off('status');
    };
  }, [id]);

  const downloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
  const el = document.getElementById('paper-content');
  if (!el) return;

  // Clone the element to avoid mutating the live DOM
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.color = '#111111';
  clone.style.backgroundColor = '#ffffff';

  // Strip any oklch/lab colors from inline styles
  const allEls = clone.querySelectorAll('*');
  allEls.forEach((child) => {
    const el = child as HTMLElement;
    if (el.style.color?.includes('lab') || el.style.color?.includes('oklch')) {
      el.style.color = '#111111';
    }
    if (el.style.backgroundColor?.includes('lab') || el.style.backgroundColor?.includes('oklch')) {
      el.style.backgroundColor = '#ffffff';
    }
  });
  document.body.appendChild(clone);

  html2pdf()
    .set({
      margin: 15,
      filename: 'question-paper.pdf',
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: { unit: 'mm', format: 'a4' },
    })
    .from(clone)
    .save()
    .then(() => {
      document.body.removeChild(clone);
    });
};

  const getDifficultyStyle = () => {
    return 'text-gray-900 font-semibold';
  };

  if (status !== 'done' || !paper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-50">
        {status === 'failed' ? (
          <div className="text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Generation Failed
            </h2>
            <p className="text-gray-500 mb-4">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => router.push('/assignments/new')}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Generating your question paper...
            </h2>
            <p className="text-gray-500 text-sm">
              This usually takes 15–30 seconds
            </p>
            <div className="mt-4 flex items-center gap-2 justify-center">
              <div
                className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  let questionNumber = 0;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Action Bar */}
      <div className="max-w-3xl mx-auto mb-5 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors font-medium"
          >
            <Download size={15} /> Download as PDF
          </button>
          <button
            onClick={() => router.push('/assignments/new')}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors font-medium"
          >
            <RefreshCw size={15} /> Regenerate
          </button>
        </div>
      </div>

      {/* Paper */}
      <div
        className="max-w-3xl mx-auto bg-white shadow-sm rounded-xl overflow-hidden"
        id="paper-content"
      >
        <div className="p-10">
          {/* School Header */}
          <div className="text-center border-b-2 border-gray-900 pb-5 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {paper.schoolName}
            </h1>
            <p className="text-sm text-gray-800 mt-1 font-medium">
              Subject: {paper.subject}
            </p>
            <p className="text-sm text-gray-800 font-medium">
              {paper.className}
            </p>
          </div>

          {/* Meta Row */}
          <div className="flex justify-between text-sm text-gray-800 mb-3 font-medium">
            <span>
              Time Allowed: <strong>{paper.timeAllowed}</strong>
            </span>
            <span>
              Maximum Marks: <strong>{paper.maxMarks}</strong>
            </span>
          </div>

          <p className="text-sm text-gray-700 mb-6 font-medium">
            All questions are compulsory unless stated otherwise.
          </p>

          {/* Student Info */}
          <div className="mb-8 space-y-2 text-sm text-gray-800 font-medium">
            <div className="flex items-center gap-2">
              <span>Name:</span>
              <span className="border-b border-gray-500 w-40 inline-block">
                &nbsp;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Roll Number:</span>
              <span className="border-b border-gray-500 w-32 inline-block">
                &nbsp;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Class:</span>
              <span className="border-b border-gray-500 w-16 inline-block">
                &nbsp;
              </span>
              <span>Section:</span>
              <span className="border-b border-gray-500 w-16 inline-block">
                &nbsp;
              </span>
            </div>
          </div>

          {/* Sections */}
          {paper.sections?.map((section: Section, si: number) => (
            <div key={si} className="mb-8">
              {/* Section Title — centered */}
              <h2 className="font-bold text-base text-gray-900 text-center mb-3">
                {section.title}
              </h2>

              {/* Section instruction */}
              <p className="text-sm italic text-gray-700 mb-4">
                {section.instruction}
              </p>

              {/* Questions */}
              <ol className="space-y-3">
                {section.questions?.map((q: Question, qi: number) => {
                  questionNumber++;
                  return (
                    <li key={qi} className="flex gap-2 text-sm text-gray-800">
                      <span className="font-medium min-w-6 shrink-0">
                        {questionNumber}.
                      </span>
                      <div className="flex-1 flex justify-between gap-4">
                        <span className="leading-relaxed">
                          <span className={`mr-1 ${getDifficultyStyle()}`}>
                            [{q.difficulty}]
                          </span>
                          {q.text
                            .replace(
                              /^\[(Easy|Moderate|Hard|Challenging)\]\s*/gi,
                              ''
                            )
                            .trim()}
                        </span>
                        <span className="shrink-0 font-medium text-gray-700 whitespace-nowrap">
                          [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}

          {/* End of paper */}
          <p className="font-bold text-sm text-gray-900 mt-6">
            End of Question Paper
          </p>

          {/* Answer Key */}
          {paper.answerKey?.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-gray-900">
              <h2 className="font-bold text-base mb-4 text-gray-900">
                Answer Key:
              </h2>
              <ol className="space-y-2">
                {paper.answerKey.map((ans: string, i: number) => (
                  <li key={i} className="text-sm text-gray-800 flex gap-2">
                    <span className="font-medium min-w-5 shrink-0">
                      {i + 1}.
                    </span>
                    <span>
                      {ans
                        .replace(
                          /^\[(Easy|Moderate|Hard|Challenging)\]\s*/gi,
                          ''
                        )
                        .trim()}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}