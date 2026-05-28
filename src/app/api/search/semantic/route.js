import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Capture from '@/models/Capture';
import { requireAuth } from '@/lib/auth';
import { generateEmbeddings } from '@/lib/gemini';

export async function GET(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 1. Generate embedding for the user's search query
    console.log('Generating embedding for:', query);
    const queryEmbedding = await generateEmbeddings(query);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn('Embedding generation returned empty result. Falling back to keyword search.');
      const keywordResults = await Capture.find({
        userId: authResult.user.id,
        status: { $ne: 'archived' },
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { rawContent: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      }).limit(10).lean();
      
      // Map to have a mock score so frontend structure remains identical
      const mapped = keywordResults.map(r => ({ ...r, score: 0.5 }));
      return NextResponse.json({ success: true, data: mapped });
    }

    console.log('Embedding generated successfully. Running Vector Search...');
    
    // 2. Perform Vector Search using MongoDB Atlas
    const results = await Capture.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 10,
        }
      },
      {
        $match: {
          userId: authResult.user.id,
          status: { $ne: 'archived' }
        }
      },
      {
        $project: {
          embedding: 0, // Don't return the huge vector array
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error('Semantic search failed:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
