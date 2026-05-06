import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Analyze text content and return structured categorization.
 * Falls back to rule-based categorization if no API key is set.
 */
export async function analyzeText(text) {
  const ai = getGenAI();

  if (!ai) {
    return fallbackAnalyze(text);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Analyze the following text and return a JSON object with these fields:
- "title": A concise title (max 80 chars) summarizing the content
- "category": One of: exam, project, deadline, resource, personal, college, other
- "urgency": One of: critical, high, medium, low, none
- "tags": An array of 1-4 relevant tags (lowercase, single words or short phrases)
- "reminderSuggestion": If there's a date/deadline mentioned, return ISO date string. If it seems urgent, suggest a date within 24 hours. Otherwise null.
- "summary": A 1-2 sentence summary

Text to analyze:
"""
${text.slice(0, 2000)}
"""

Return ONLY valid JSON, no markdown formatting.`;

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
    const prompt = `Look at this screenshot and analyze it. Return a JSON object with:
- "title": A concise title (max 80 chars) describing what this screenshot is about
- "category": One of: exam, project, deadline, resource, personal, college, other
- "urgency": One of: critical, high, medium, low, none (based on content — deadlines = high/critical, notes = low, etc.)
- "tags": An array of 1-4 relevant tags (lowercase)
- "reminderSuggestion": If there's a date/deadline visible, return ISO date string. Otherwise null.
- "summary": A 1-2 sentence summary of the screenshot content
- "extractedText": All readable text from the screenshot

Return ONLY valid JSON, no markdown formatting.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
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
    if (/system.?design|hld|lld|scalab/.test(lower)) category = 'system-design';
    else if (/dsa|algo|data.?struct|leetcode|array|tree|graph/.test(lower)) category = 'dsa';
    else if (/react|next|html|css|javascript|node|web/.test(lower)) category = 'web-dev';
    else if (/sql|mongo|database|db/.test(lower)) category = 'database';
    else if (/docker|k8s|aws|cloud|devops|ci.?cd/.test(lower)) category = 'devops';
    else if (/math|calculus|linear|probability/.test(lower)) category = 'math';
    else if (/college|semester|unit|syllabus/.test(lower)) category = 'college';

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
- "category": One of: system-design, dsa, web-dev, database, devops, math, college, notes, other
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
