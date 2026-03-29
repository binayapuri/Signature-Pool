import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    if (!documentId) return NextResponse.json({ success: false, error: 'No ID' }, { status: 400 });

    const metaPath = path.join(process.cwd(), '_metadata', `${documentId}.json`);
    if (!existsSync(metaPath)) {
      return NextResponse.json({ success: true, signatures: [] });
    }

    const data = await readFile(metaPath, 'utf8');
    return NextResponse.json({ success: true, signatures: JSON.parse(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { documentId, signatures } = await request.json();

    if (!documentId || !signatures) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    const metaPath = path.join(process.cwd(), '_metadata', `${documentId}.json`);
    
    // Read existing
    let existingSignatures = [];
    if (existsSync(metaPath)) {
      const data = await readFile(metaPath, 'utf8');
      existingSignatures = JSON.parse(data);
    }

    // Merge new ones (or we can just replace, wait... The client gives us the array they placed + maybe old ones? Let's just assume the client sends ONLY the new ones, and we append.)
    // Wait, if client can zoom/drag existing, maybe client sends ALL current signatures on screen?
    // Let's assume the client sends ALL signatures that should be there (standardizing).
    await writeFile(metaPath, JSON.stringify(signatures, null, 2));

    return NextResponse.json({ success: true, message: 'Signatures saved successfully.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to save signatures' }, { status: 500 });
  }
}
