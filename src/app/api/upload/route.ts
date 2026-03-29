import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a secure unique ID and keep original extension
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.name) || '';
    const filename = `${uniqueId}${ext}`;
    const targetPath = path.join(process.cwd(), '_uploads', filename);

    await writeFile(targetPath, buffer);

    return NextResponse.json({ success: true, id: uniqueId, filename });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
