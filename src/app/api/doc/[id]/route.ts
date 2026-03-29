import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const { id } = p;
    
    // Prevent directory traversal
    if (id.includes('..') || id.includes('/')) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), '_uploads');
    const files = await readdir(uploadsDir);
    const matchedFile = files.find(f => f === id || f.startsWith(id + '.'));
    
    if (!matchedFile) {
      return new NextResponse('Not found', { status: 404 });
    }

    const targetPath = path.join(uploadsDir, matchedFile);
    const file = await readFile(targetPath);
    const ext = path.extname(matchedFile).toLowerCase();
    
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');

    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.doc' || ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new NextResponse(file, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': download ? `attachment; filename="${id}"` : 'inline', 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse('Error loading document', { status: 500 });
  }
}
