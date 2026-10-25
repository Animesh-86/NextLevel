import { getGenAI, getGroq } from './aiClients';
import { extractQuestionsFromJson } from './questionParser';

/**
 * Validate and clean AI-generated question objects.
 */
function validateAndCleanQuestions(questions) {
  if (!Array.isArray(questions)) return [];

  return questions
    .filter(q => q && q.scenario && Array.isArray(q.options) && q.options.length >= 2)
    .map(q => {
      const opts = q.options.map(o => String(o).trim());
      let ans = Array.isArray(q.answer)
        ? q.answer.filter(a => typeof a === 'number' && a >= 0 && a < opts.length)
        : [];
      if (ans.length === 0) {
        ans = [Math.floor(Math.random() * opts.length)];
      }

      // Randomly shuffle options and remap answer indices
      const indices = opts.map((_, idx) => idx);
      for (let j = indices.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [indices[j], indices[k]] = [indices[k], indices[j]];
      }
      const shuffledOptions = indices.map(idx => opts[idx]);
      const remappedAnswer = ans
        .map(origIdx => indices.indexOf(origIdx))
        .filter(newIdx => newIdx !== -1)
        .sort((a, b) => a - b);

      return {
        scenario: String(q.scenario).trim(),
        options: shuffledOptions,
        answer: remappedAnswer.length > 0 ? remappedAnswer : [0],
        type: (q.type === 'MSQ' || remappedAnswer.length > 1) ? 'MSQ' : 'MCQ',
        explanation: q.explanation ? String(q.explanation).trim() : 'Parsed from document.',
      };
    })
    .filter(q => q.answer.length > 0);
}

/**
 * AI-powered question extraction — works with ANY format.
 */
async function parseQuestionsWithAI(text) {
  const groq = getGroq();
  const ai = getGenAI();

  const prompt = `You are a question extraction engine. Analyze the following text and extract ALL multiple-choice questions from it.

For EACH question, return a JSON object with:
- "scenario": The full question text (string)
- "options": Array of option strings (the answer choices). Remove any leading labels like "A)", "a.", "1)", etc.
- "answer": Array of zero-indexed integers indicating which option(s) are correct. Distribute answers across options evenly (A, B, C, D / 0, 1, 2, 3).
- "type": "MCQ" if single correct answer, "MSQ" if multiple correct answers
- "explanation": A brief explanation of why the answer is correct (generate one if not provided in text)

Rules:
- Extract questions even if they use different numbering styles (1., Q1, Question 1, •, -, etc.)
- Handle answer keys at the end of the document OR inline correct-answer markers (like *, ✓, "correct", bold, etc.)
- If options are labeled A/B/C/D or a/b/c/d or 1/2/3/4, strip the label prefix from the option text
- Ignore headers, instructions, and non-question content
- Return a JSON array of question objects. If no questions found, return an empty array []
- Return ONLY valid JSON, no markdown formatting

Text to analyze:
"""
${text.slice(0, 15000)}
"""

Return ONLY a valid JSON array.`;

  // Try Groq first
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
        temperature: 0.1,
      });
      const response = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(response);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || [];
      return validateAndCleanQuestions(questions);
    } catch (err) {
      console.error('Groq question parsing failed, trying Gemini:', err.message);
    }
  }

  // Fallback to Gemini
  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || [];
      return validateAndCleanQuestions(questions);
    } catch (err) {
      console.error('Gemini question parsing failed:', err.message);
    }
  }

  return null; // Signal to caller that AI is unavailable
}

/**
 * Legacy regex parser for the ---ANSWERS--- delimited format.
 */
function parseQuestionsWithRegex(text) {
  const parts = text.split(/---ANSWERS---/i);
  if (parts.length < 2) {
    throw new Error(
      'Could not parse questions. AI parsing is unavailable and the document does not use the manual format.\n\n' +
      'Accepted manual format:\n' +
      '1. Question text\n' +
      'A) Option one\nB) Option two\nC) Option three\nD) Option four\n\n' +
      '---ANSWERS---\n' +
      '1 A\n2 B,C\n'
    );
  }
  
  const mainText = parts[0];
  const answersText = parts[1];
  
  // Parse answers
  const answerDict = {};
  const ansRegex = /^(\d+)\s+([A-Z](?:,[A-Z])*)/gm;
  let m;
  while ((m = ansRegex.exec(answersText)) !== null) {
    answerDict[m[1]] = m[2].split(',').map(s => s.trim());
  }

  // Parse questions
  const qRegex = /(?:^|\n)(\d+)\.\s+([\s\S]*?)(?=(?:\n\d+\.\s+)|$)/g;
  const questions = [];
  
  while ((m = qRegex.exec(mainText)) !== null) {
    const qNum = m[1];
    let qContent = m[2].trim();
    
    const optRegex = /\n([A-Z])\)\s+([\s\S]*?)(?=\n[A-Z]\)\s+|$)/g;
    let options = [];
    let qText = qContent;
    
    const firstOptMatch = /\n[A-Z]\)\s+/.exec('\n' + qContent);
    if (firstOptMatch) {
        qText = ('\n' + qContent).substring(0, firstOptMatch.index).trim();
        
        let optM;
        const optsText = ('\n' + qContent).substring(firstOptMatch.index);
        while ((optM = optRegex.exec(optsText)) !== null) {
            options.push({ letter: optM[1], text: optM[2].trim() });
        }
    }
    
    if (options.length === 0) continue; 
    
    const ansLetters = answerDict[qNum];
    if (!ansLetters) continue; 
    
    const answerIndices = [];
    ansLetters.forEach(letter => {
        const idx = options.findIndex(o => o.letter === letter);
        if (idx !== -1) answerIndices.push(idx);
    });
    
    if (answerIndices.length === 0) continue;

    questions.push({
      scenario: qText,
      options: options.map(o => o.text),
      answer: answerIndices,
      type: answerIndices.length > 1 ? "MSQ" : "MCQ",
      explanation: "Parsed from document."
    });
  }
  
  if (questions.length === 0) {
    throw new Error(
      'No valid questions found in the document.\n\n' +
      'Make sure your document has numbered questions (1., 2., ...) with options (A), B), ...) ' +
      'and an ---ANSWERS--- section at the end.'
    );
  }

  return questions;
}

/**
 * Generate questions from raw text using AI (primary) or regex fallback.
 */
export async function generateQuestionsFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const trimmed = text.trim();

  // 1. Fast path: If the input text is JSON, extract directly (handles 100+ questions instantly with 0 loss)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const jsonQuestions = extractQuestionsFromJson(parsed);
      if (jsonQuestions && jsonQuestions.length > 0) {
        return jsonQuestions;
      }
    } catch (e) {
      // Not pure JSON, proceed to AI
    }
  }

  // 2. Try AI-powered parsing
  try {
    const aiQuestions = await parseQuestionsWithAI(text);
    if (aiQuestions && aiQuestions.length > 0) {
      return aiQuestions;
    }
  } catch (err) {
    console.error('AI question parsing failed, trying regex fallback:', err.message);
  }

  // 3. Fallback: legacy regex parser for ---ANSWERS--- format
  return parseQuestionsWithRegex(text);
}
