/**
 * Question Parser Library
 * Parses questions from various text formats into structured objects.
 */

/**
 * Parse the standard text format:
 * 
 * 1. Question text?
 * A) Option A
 * B) Option B
 * C) Option C
 * D) Option D
 * 
 * ---ANSWERS---
 * 1. C
 * 2. A, D
 */
export function parseTextFormat(text, examId, moduleName = 'General') {
  if (!text || !text.trim()) {
    return { questions: [], errors: ['Empty input'] };
  }

  const errors = [];
  const questions = [];

  // Split by answer separator
  const parts = text.split(/---\s*ANSWERS\s*---/i);
  const questionsPart = parts[0];
  const answersPart = parts[1] || '';

  // Parse answers first
  const answerMap = {};
  if (answersPart.trim()) {
    const answerLines = answersPart.trim().split('\n').filter(l => l.trim());
    for (const line of answerLines) {
      const match = line.match(/^\s*(\d+)\.\s*(.+)/);
      if (match) {
        const num = parseInt(match[1]);
        const answerLetters = match[2].split(/[,\s]+/).map(a => a.trim().toUpperCase()).filter(Boolean);
        answerMap[num] = answerLetters.map(letter => letter.charCodeAt(0) - 65); // A=0, B=1, etc.
      }
    }
  }

  // Parse questions — split by question number pattern
  const questionBlocks = questionsPart.split(/(?=^\s*\d+\.\s)/m).filter(b => b.trim());

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim();
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length < 3) {
      errors.push(`Question block ${i + 1}: Not enough lines (need question + at least 2 options)`);
      continue;
    }

    // Extract question number and text
    const questionMatch = lines[0].match(/^\s*(\d+)\.\s*(.+)/);
    if (!questionMatch) {
      errors.push(`Block ${i + 1}: Could not parse question number`);
      continue;
    }

    const questionNum = parseInt(questionMatch[1]);
    let scenario = questionMatch[2];

    // Collect option lines and scenario continuation
    const options = [];
    for (let j = 1; j < lines.length; j++) {
      const optMatch = lines[j].match(/^[A-Z][).\]]\s*(.+)/);
      if (optMatch) {
        options.push(optMatch[1]);
      } else if (options.length === 0) {
        // This is continuation of the question text
        scenario += ' ' + lines[j];
      }
    }

    if (options.length < 2) {
      errors.push(`Question ${questionNum}: Found ${options.length} options, need at least 2`);
      continue;
    }

    // Get answer from answer map
    const answer = answerMap[questionNum] || [];
    const type = answer.length > 1 ? 'MSQ' : 'MCQ';
    const chooseCount = answer.length || 1;

    questions.push({
      examId,
      module: moduleName,
      type,
      scenario: scenario.trim(),
      options,
      answer,
      chooseCount,
      explanation: '',
    });
  }

  // Warn about questions without answers
  questions.forEach((q, idx) => {
    if (q.answer.length === 0) {
      errors.push(`Question ${idx + 1}: No answer provided in ANSWERS section`);
    }
  });

  return { questions, errors };
}

/**
 * Parse CSV format
 * Expected columns: scenario, optionA, optionB, optionC, optionD, answer, module, explanation
 * Answer can be: "C" or "A,D" (letter-based)
 */
export function parseCSVRows(rows, examId) {
  const errors = [];
  const questions = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for header row and 0-index

    const scenario = row.scenario || row.question || row[0];
    if (!scenario) {
      errors.push(`Row ${rowNum}: Missing question/scenario text`);
      continue;
    }

    // Collect options
    const options = [];
    const optKeys = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF'];
    const altKeys = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f'];
    const indexKeys = [1, 2, 3, 4, 5, 6];

    for (let o = 0; o < optKeys.length; o++) {
      const val = row[optKeys[o]] || row[altKeys[o]] || row[indexKeys[o]];
      if (val && val.trim()) options.push(val.trim());
    }

    if (options.length < 2) {
      errors.push(`Row ${rowNum}: Need at least 2 options, found ${options.length}`);
      continue;
    }

    // Parse answer
    const answerStr = row.answer || row.answers || row[options.length + 1] || '';
    const answerLetters = answerStr.split(/[,\s]+/).map(a => a.trim().toUpperCase()).filter(Boolean);
    const answer = answerLetters.map(letter => {
      if (/^\d+$/.test(letter)) return parseInt(letter);
      return letter.charCodeAt(0) - 65;
    }).filter(a => a >= 0 && a < options.length);

    if (answer.length === 0) {
      errors.push(`Row ${rowNum}: Invalid or missing answer "${answerStr}"`);
    }

    const moduleName = row.module || row.category || 'General';
    const explanation = row.explanation || row.explain || '';

    questions.push({
      examId,
      module: moduleName.trim(),
      type: answer.length > 1 ? 'MSQ' : 'MCQ',
      scenario: scenario.trim(),
      options,
      answer,
      chooseCount: answer.length || 1,
      explanation: explanation.trim(),
    });
  }

  return { questions, errors };
}
