import { z } from 'zod';

// ─── User Schemas ───
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ─── Exam Schemas ───
export const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().default(''),
  timeLimit: z.number().min(1).max(480).default(60),
  passPercentage: z.number().min(1).max(100).default(75),
});

export const updateExamSchema = createExamSchema.partial();

// ─── Question Schemas ───
export const createQuestionSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  module: z.string().min(1).default('General'),
  type: z.enum(['MCQ', 'MSQ']).default('MCQ'),
  scenario: z.string().min(1, 'Question text is required'),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options required'),
  answer: z.array(z.number().min(0)).min(1, 'At least one answer required'),
  chooseCount: z.number().min(1).default(1),
  explanation: z.string().optional().default(''),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// ─── Result Schemas ───
export const createResultSchema = z.object({
  examId: z.string().min(1),
  scorePercent: z.number().min(0).max(100),
  correctCount: z.number().min(0),
  wrongCount: z.number().min(0),
  skippedCount: z.number().min(0),
  totalCount: z.number().min(1),
  passed: z.boolean(),
  timeTaken: z.number().min(0).optional(),
  userAnswers: z.record(z.array(z.number())).optional(),
});

// ─── Validation Helper ───
export function validateBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return { error: errors.join(', '), data: null };
  }
  return { error: null, data: result.data };
}
