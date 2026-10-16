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

/**
 * Universal JSON Question Extractor.
 * Parses question banks from any JSON structure:
 * - Direct array of questions
 * - Nested sections / chapters (e.g. part_1_..., part_2_...)
 * - Containers with questions/mcqs/data/items keys
 * Normalizes question, scenario, options, answer indices (supports 0-based, letters, strings), MSQ detection, chooseCount, explanation.
 */
export function extractQuestionsFromJson(data, examId = null, defaultModule = 'General') {
  if (!data) return [];

  let rawItems = [];

  if (Array.isArray(data)) {
    rawItems = data;
  } else if (typeof data === 'object' && data !== null) {
    // 1. Check known container keys: questions, mcqs, data, items, questionList, examQuestions
    for (const key of ['questions', 'mcqs', 'data', 'items', 'questionList', 'examQuestions']) {
      if (Array.isArray(data[key])) {
        rawItems = data[key];
        break;
      }
    }

    // 2. If not found, scan all object properties for arrays of objects (e.g. part_1_..., part_2_..., chapter_1_...)
    if (rawItems.length === 0) {
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          if (val.some(item => item && (item.scenario || item.question || item.text || item.prompt))) {
            rawItems.push(...val);
          }
        }
      }
    }

    // 3. If still empty, check if the object itself is a single question
    if (rawItems.length === 0 && (data.scenario || data.question || data.text || data.prompt)) {
      rawItems = [data];
    }
  }

  const normalized = [];

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;

    // 1. Extract scenario/question prompt
    const scenario = item.scenario || item.question || item.text || item.prompt || item.q || '';
    if (!scenario || typeof scenario !== 'string' || !scenario.trim()) continue;

    // 2. Extract options
    let rawOptions = item.options || item.choices || item.answers;
    let options = [];
    if (Array.isArray(rawOptions)) {
      options = rawOptions.map(opt => typeof opt === 'string' ? opt.trim() : (opt?.text || String(opt || '')).trim());
    } else if (typeof rawOptions === 'object' && rawOptions !== null) {
      options = Object.values(rawOptions).map(opt => String(opt || '').trim());
    }

    options = options.filter(Boolean);
    if (options.length < 2) continue;

    // 3. Extract answer
    let rawAnswer = item.answer ?? item.correct_answer ?? item.correctAnswer ?? item.correct ?? item.correctOptions ?? item.key ?? item.ans;
    let answerIndices = [];

    const parseAnswerValue = (val) => {
      if (val === null || val === undefined) return;
      if (typeof val === 'number') {
        if (val >= 0 && val < options.length) answerIndices.push(val);
      } else if (typeof val === 'string') {
        const trimmed = val.trim();
        if (/^[A-Za-z]$/.test(trimmed)) {
          const idx = trimmed.toUpperCase().charCodeAt(0) - 65;
          if (idx >= 0 && idx < options.length) answerIndices.push(idx);
        } else if (!isNaN(parseInt(trimmed))) {
          const idx = parseInt(trimmed);
          if (idx >= 0 && idx < options.length) answerIndices.push(idx);
        } else {
          const idx = options.findIndex(opt => opt.toLowerCase() === trimmed.toLowerCase());
          if (idx !== -1) answerIndices.push(idx);
        }
      }
    };

    if (Array.isArray(rawAnswer)) {
      for (const a of rawAnswer) parseAnswerValue(a);
    } else {
      parseAnswerValue(rawAnswer);
    }

    if (answerIndices.length === 0) {
      answerIndices = [0];
    }

    answerIndices = [...new Set(answerIndices)].sort((a, b) => a - b);
    if (answerIndices.length === 0) answerIndices = [0];

    // 4. Determine type (MCQ or MSQ)
    let type = (item.type || '').toUpperCase();
    if (type !== 'MCQ' && type !== 'MSQ') {
      type = answerIndices.length > 1 ? 'MSQ' : 'MCQ';
    }

    // 5. Explanation
    const explanation = item.explanation || item.rationale || item.solution || item.detail || '';
    const moduleName = item.chapter || item.module || item.category || defaultModule;

    const qObj = {
      scenario: scenario.trim(),
      options,
      answer: answerIndices,
      type,
      explanation: typeof explanation === 'string' ? explanation.trim() : '',
      module: typeof moduleName === 'string' ? moduleName.trim() : defaultModule,
      chooseCount: answerIndices.length > 1 ? answerIndices.length : 1,
    };

    if (examId) qObj.examId = examId;

    normalized.push(qObj);
  }

  return normalized;
}

/**
 * Strict check for whether a question is a multiple-select (MSQ) question.
 */
export function isMSQQuestion(q) {
  if (!q) return false;
  // 1. Explicit question type check
  const type = String(q.type || '').trim().toUpperCase();
  if (type === 'MSQ' || type === 'MULTIPLE_SELECT' || type.includes('MSQ') || type.includes('MULTI') || type.includes('CHECKBOX')) {
    return true;
  }
  // 2. chooseCount > 1
  const cc = Number(q.chooseCount);
  if (!isNaN(cc) && cc > 1) return true;

  // 3. answer array with multiple indices
  if (Array.isArray(q.answer) && q.answer.length > 1) return true;
  if (Array.isArray(q.answers) && q.answers.length > 1) return true;
  if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 1) return true;

  // 4. answer string formatted like "[0, 1]" or "0, 1, 2" or "A, B"
  if (typeof q.answer === 'string') {
    const trimmed = q.answer.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 1) return true;
      } catch (e) {}
    }
    if (trimmed.includes(',') || trimmed.includes(';') || trimmed.includes('&')) return true;
  }

  // 5. Scenario text indicators for multiple-select questions
  const scenario = String(q.scenario || '').toLowerCase();
  if (
    scenario.includes('select all') ||
    scenario.includes('choose all') ||
    scenario.includes('multiple options') ||
    scenario.includes('which workarounds are described') ||
    scenario.includes('which of the following are')
  ) {
    return true;
  }

  return false;
}

