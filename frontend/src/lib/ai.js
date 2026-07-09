import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

let genAI = null;
let groqClient = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });
  }
  return genAI;
}

function getGroq() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * Analyze text content and return structured categorization.
 * Falls back to rule-based categorization if no API key is set.
 */
export async function analyzeText(text) {
  const ai = getGenAI();
  const groq = getGroq();

  const prompt = `Analyze the following text and return a JSON object with these fields:
- "title": A concise title (max 80 chars) summarizing the content
- "category": One of: exam, project, deadline, resource, personal, college, work, job-posting, tutorial, code, idea, other
- "urgency": One of: critical, high, medium, low, none
- "tags": An array of 1-4 relevant tags (lowercase, single words or short phrases)
- "reminderSuggestion": If there's a date, deadline, or time mentioned, return the exact ISO date string (YYYY-MM-DDTHH:MM:SS) representing it. Otherwise null.
- "extractedLink": Any URL, website link, or domain mentioned in the text (e.g. https://example.com/page). Otherwise null.
- "summary": A 1-2 sentence summary

Text to analyze:
"""
${text.slice(0, 2000)}
"""

Return ONLY valid JSON, no markdown formatting.`;

  // 1. Try Groq (Llama 3) First (Free & Super Fast)
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant", // Lightning fast open-source model
        response_format: { type: "json_object" }
      });
      const response = completion.choices[0]?.message?.content;
      return JSON.parse(response || '{}');
    } catch (err) {
      console.error('Groq analysis failed, falling back to Gemini:', err.message);
    }
  }

  // 2. Fallback to Gemini 2.0 Flash
  if (!ai) {
    return fallbackAnalyze(text);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini text analysis failed, using fallback:', err.message);
    return fallbackAnalyze(text);
  }
}

/**
 * Analyze a screenshot image and extract structured data.
 * Falls back to returning minimal data if no API key.
 */
export async function analyzeImage(base64Image, mimeType = 'image/png') {
  const ai = getGenAI();
  const groq = getGroq();

  const prompt = `Look at this screenshot and analyze it. Return a JSON object with:
- "title": A concise title (max 80 chars) describing what this screenshot is about
- "category": One of: exam, project, deadline, resource, personal, college, work, job-posting, tutorial, code, idea, other
- "urgency": One of: critical, high, medium, low, none (based on content — deadlines = high/critical, notes = low, etc.)
- "tags": An array of 1-4 relevant tags (lowercase)
- "reminderSuggestion": If there's a date, deadline, or time mentioned or visible, return the exact ISO date string (YYYY-MM-DDTHH:MM:SS) representing it. Otherwise null.
- "extractedLink": Any URL, website link, or domain mentioned in the text (e.g. https://example.com/page). Otherwise null.
- "summary": A 1-2 sentence summary of the screenshot content
- "extractedText": All readable text from the screenshot

Return ONLY valid JSON, no markdown formatting.`;

  let cleanBase64 = base64Image;
  let finalMimeType = mimeType;
  
  // Strip data URI prefix if present
  if (base64Image.startsWith('data:')) {
    const parts = base64Image.split(',');
    if (parts.length === 2) {
      cleanBase64 = parts[1];
      finalMimeType = parts[0].split(';')[0].replace('data:', '');
    }
  }

  // 1. Try Groq Vision first
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${finalMimeType};base64,${cleanBase64}` } }
            ]
          }
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.1,
      });
      const responseText = completion.choices[0]?.message?.content || '{}';
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Groq vision analysis failed, falling back to Gemini:', err.message);
    }
  }

  // 2. Fallback to Gemini
  if (!ai) {
    return {
      title: 'Screenshot Capture',
      category: 'other',
      urgency: 'none',
      tags: ['screenshot'],
      reminderSuggestion: null,
      summary: 'Uploaded screenshot (AI analysis unavailable)',
      extractedText: '',
    };
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: finalMimeType,
          data: cleanBase64,
        },
      },
    ]);

    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini image analysis failed:', err.message);
    return {
      title: 'Screenshot Capture',
      category: 'other',
      urgency: 'none',
      tags: ['screenshot'],
      reminderSuggestion: null,
      summary: 'Uploaded screenshot (analysis failed)',
      extractedText: '',
    };
  }
}

/**
 * Rule-based fallback when Gemini API is unavailable.
 */
function fallbackAnalyze(text) {
  const lower = text.toLowerCase();

  // Detect category
  let category = 'other';
  if (/exam|test|quiz|mcq|marks|score|grade|syllabus/.test(lower)) category = 'exam';
  else if (/project|github|repo|deploy|build|code/.test(lower)) category = 'project';
  else if (/deadline|due|submit|assignment|last date/.test(lower)) category = 'deadline';
  else if (/http|www|link|article|blog|video|tutorial|resource/.test(lower)) category = 'resource';
  else if (/college|class|lecture|professor|semester/.test(lower)) category = 'college';

  // Detect urgency
  let urgency = 'none';
  if (/urgent|asap|immediately|critical|emergency/.test(lower)) urgency = 'critical';
  else if (/important|deadline|due today|due tomorrow/.test(lower)) urgency = 'high';
  else if (/soon|this week|reminder|don't forget/.test(lower)) urgency = 'medium';
  else if (/later|sometime|when possible|fyi/.test(lower)) urgency = 'low';

  // Generate title
  const firstLine = text.split('\n')[0].trim();
  const title = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine || 'New Capture';

  // Detect URL
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  const tags = [];
  if (urlMatch) tags.push('link');
  if (category !== 'other') tags.push(category);

  return {
    title,
    category,
    urgency,
    tags,
    reminderSuggestion: null,
    summary: text.slice(0, 200),
  };
}

/**
 * Analyze a PDF or document and return title, summary, category, and tags.
 */
export async function analyzePDF(base64Data, mimeType, fileName) {
  const ai = getGenAI();

  if (!ai) {
    // Fallback: extract info from filename
    const name = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    let category = 'other';
    const lower = name.toLowerCase();
    if (/budget|finance|money|expense|invoice/.test(lower)) category = 'finance';
    if (/health|medical|fitness|workout|diet/.test(lower)) category = 'health';
    if (/school|college|university|class|course|education/.test(lower)) category = 'education';
    if (/project|plan|timeline|milestone/.test(lower)) category = 'projects';
    if (/work|meeting|resume|job|career/.test(lower)) category = 'work';

    return {
      title: name.slice(0, 100),
      summary: `Study material: ${name}`,
      category,
      tags: [category.replace('-', ' ')],
    };
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Analyze this document/file and return a JSON object with:
- "title": A clear, descriptive title (max 100 chars)
- "summary": A 2-4 sentence summary of the document's contents and key topics
- "category": One of: work, personal, education, finance, health, projects, notes, other
- "tags": An array of 3-6 relevant tags (lowercase)

Document filename: "${fileName}"

Return ONLY valid JSON, no markdown formatting.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini PDF analysis failed:', err.message);
    return {
      title: fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').slice(0, 100),
      summary: `Uploaded document: ${fileName}`,
      category: 'other',
      tags: ['document'],
    };
  }
}

/**
 * Generate vector embeddings for a piece of text.
 */
export async function generateEmbeddings(text) {
  const ai = getGenAI();
  if (!ai) return [];

  try {
    const model = ai.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text.slice(0, 8000));
    return result.embedding.values;
  } catch (err) {
    console.error("DEBUG: Gemini embedding generation failed:", err.message);
    return [];
  }
}

/**
 * Generate questions from raw text using AI
 */
export async function generateQuestionsFromText(text) {
  const ai = getGenAI();
  const groq = getGroq();

  const prompt = `Extract exam/study questions from the following text and return a JSON array of question objects. 
Each question object MUST have these EXACT fields:
- "scenario": The question text (string)
- "options": An array of exactly 4 strings (the multiple choice options)
- "answer": An array of integers (e.g. [0] if the first option is correct). 0-indexed.
- "type": Always "MCQ"
- "explanation": A brief explanation of the correct answer (string)

Generate as many relevant questions as you can find in the text (up to 20).

Text to extract from:
"""
${text.slice(0, 15000)}
"""

Return ONLY a valid JSON array, no markdown formatting.`;

  // 1. Try Groq (Llama 3) First for speed
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
      });
      const response = completion.choices[0]?.message?.content;
      const parsed = JSON.parse(response || '{}');
      return Array.isArray(parsed) ? parsed : (parsed.questions || []);
    } catch (err) {
      console.error('Groq question generation failed, falling back to Gemini:', err.message);
    }
  }

  // 2. Fallback to Gemini
  if (!ai) {
    throw new Error('No AI provider available. Set GEMINI_API_KEY or GROQ_API_KEY.');
  }

  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : (parsed.questions || []);
}
