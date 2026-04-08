import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { parseTextFormat, parseCSVRows } from '@/lib/questionParser';
import { parse } from 'csv-parse/sync';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const formData = await req.formData();
    const file = formData.get('file');
    const examId = formData.get('examId');
    const moduleName = formData.get('module') || 'General';
    const textContent = formData.get('text'); // For raw text paste

    if (!examId) {
      return NextResponse.json({ success: false, error: 'examId is required' }, { status: 422 });
    }

    let result;

    if (textContent) {
      // Direct text parsing
      result = parseTextFormat(textContent, examId, moduleName);
    } else if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        // CSV parsing
        const csvText = buffer.toString('utf-8');
        const records = parse(csvText, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
        result = parseCSVRows(records, examId);
      } else if (fileName.endsWith('.pdf')) {
        // PDF parsing
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        result = parseTextFormat(pdfData.text, examId, moduleName);
      } else if (fileName.endsWith('.docx')) {
        // Word parsing
        const mammoth = await import('mammoth');
        const docResult = await mammoth.extractRawText({ buffer });
        result = parseTextFormat(docResult.value, examId, moduleName);
      } else {
        return NextResponse.json(
          { success: false, error: 'Unsupported file type. Use PDF, DOCX, or CSV.' },
          { status: 422 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'No file or text content provided' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        questions: result.questions,
        errors: result.errors,
        count: result.questions.length,
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
