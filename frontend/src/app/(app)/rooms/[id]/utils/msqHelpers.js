// ─── STRICT MSQ DETECTION & SINGLE-CHOICE MCQ NORMALIZATION ───
export const isMSQQuestion = (q) => {
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
    if (!Array.isArray(q.answer) || q.answer.length !== 1) return true;
  }

  return false;
};

export const getSingleCorrectAnswerIndex = (q) => {
  if (!q) return 0;
  const ans = q.answer;
  if (Array.isArray(ans) && ans.length > 0) {
    const val = Number(ans[0]);
    return isNaN(val) ? 0 : val;
  }
  if (typeof ans === 'number') return ans;
  if (typeof ans === 'string') {
    const parsed = parseInt(ans.replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};
