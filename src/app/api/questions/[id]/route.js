import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import { auth } from '@/lib/auth';
import { updateQuestionSchema, validateBody } from '@/lib/validate';

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const question = await Question.findById(id);

    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Allow special SRS update (increment timesTested/timesFailed)
    if (body._srsUpdate) {
      const update = {};
      if (body.incrementTested) update.$inc = { ...update.$inc, timesTested: 1 };
      if (body.incrementFailed) update.$inc = { ...update.$inc, timesFailed: 1 };

      const question = await Question.findByIdAndUpdate(id, update, { new: true });
      if (!question) {
        return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: question });
    }

    const { error, data } = validateBody(updateQuestionSchema, body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 422 });
    }

    const question = await Question.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { message: 'Question deleted' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
