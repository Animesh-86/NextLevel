import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const data = await pdf(buffer);
      text = data.text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      const data = await mammoth.extractRawText({ buffer });
      text = data.value;
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported file type. Use PDF, DOCX, or TXT.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({ success: false, error: 'Failed to extract text: ' + error.message }, { status: 500 });
  }
}
