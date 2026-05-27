import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface QuestionTypeInput {
  type: string;
  count: number;
  marks: number;
}

export const generateQuestionPaper = async (
  questionTypes: QuestionTypeInput[],
  additionalInstructions: string,
  fileText: string
) => {
  const totalMarks = questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);
  const totalQuestions = questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const sectionLabels = ['A', 'B', 'C', 'D', 'E'];

  const sectionInstructions: Record<string, string> = {
    'Multiple Choice Questions': `Attempt all questions. Each question carries {marks} mark(s).`,
    'Short Questions': `Answer in 2-3 sentences. Each question carries {marks} mark(s).`,
    'Diagram/Graph-Based Questions': `Draw and label the diagram clearly. Each question carries {marks} mark(s).`,
    'Numerical Problems': `Show all steps clearly. Each question carries {marks} mark(s).`,
    'Long Questions': `Answer in detail. Each question carries {marks} mark(s).`,
  };

  const sectionsConfig = questionTypes.map((qt, i) => ({
    label: sectionLabels[i] || String.fromCharCode(65 + i),
    ...qt,
    instruction: (
      sectionInstructions[qt.type] ||
      'Attempt all questions. Each question carries {marks} mark(s).'
    ).replace('{marks}', String(qt.marks)),
  }));

  const prompt = `
You are an expert teacher creating a structured exam question paper.

CONTENT SOURCE:
${fileText
  ? `Use this material to create questions:\n${fileText}`
  : 'Create general science questions for Grade 8 students.'
}

QUESTION REQUIREMENTS:
${sectionsConfig
  .map(
    (s) =>
      `Section ${s.label}: ${s.type} - ${s.count} questions x ${s.marks} marks each`
  )
  .join('\n')}

ADDITIONAL INSTRUCTIONS: ${additionalInstructions || 'None'}

STRICT RULES (follow exactly):
- Return ONLY valid JSON, no markdown, no extra text, no explanation
- difficulty field must be exactly "Easy", "Moderate", or "Hard" — nothing else
- Difficulty distribution per section: 40% Easy, 40% Moderate, 20% Hard
- NEVER include [Easy], [Moderate], [Hard], [Challenging] or ANY bracket tags inside the question text
- NEVER include the marks like [2 Marks] inside the question text
- Question text must start directly with the question — clean and professional
- Every question MUST end with a question mark (?)
- Do NOT number the questions inside the text
- answerKey must have exactly ${totalQuestions} answers in order
- Make questions specific and relevant to the content provided
Return this EXACT JSON structure and nothing else:
{
  "schoolName": "Delhi Public School, Bokaro",
  "subject": "Science",
  "className": "Class 8th",
  "timeAllowed": "45 minutes",
  "maxMarks": ${totalMarks},
  "sections": [
    ${sectionsConfig
      .map(
        (s) => `{
      "title": "Section ${s.label}",
      "instruction": "${s.instruction}",
      "questions": [
        ${Array(s.count)
          .fill(0)
          .map(
            () => `{
          "text": "Write your question here without any tags?",
          "difficulty": "Easy",
          "marks": ${s.marks}
        }`
          )
          .join(',\n        ')}
      ]
    }`
      )
      .join(',\n    ')}
  ],
  "answerKey": ${JSON.stringify(Array(totalQuestions).fill('Answer here'))}
}
`;

  console.log('🤖 Calling Groq API...');

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const rawText = response.choices[0].message.content || '';

  // Clean up any markdown formatting just in case
  const cleaned = rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Parse — never return raw text to frontend
  const parsed = JSON.parse(cleaned);

  // Extra safety — strip any leftover tags from question text
  parsed.sections = parsed.sections.map((section: any) => ({
    ...section,
    questions: section.questions.map((q: any) => ({
      ...q,
      text: q.text
        .replace(/^\[(Easy|Moderate|Hard|Challenging)\]\s*/gi, '')
        .trim(),
    })),
  }));

  console.log('✅ Groq response parsed successfully');
  return parsed;
};