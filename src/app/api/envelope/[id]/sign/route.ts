import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, saveDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const body = await request.json();
    const { signerId, signatures } = body;

    const db = getDb();
    const envIndex = db.envelopes.findIndex(e => e.id === p.id);
    
    if (envIndex === -1) {
      return NextResponse.json({ success: false, error: 'Envelope not found' }, { status: 404 });
    }

    const env = db.envelopes[envIndex];
    
    const signerIndex = env.signers.findIndex(s => s.id === signerId);
    if (signerIndex === -1) {
      return NextResponse.json({ success: false, error: 'Signer not found' }, { status: 404 });
    }

    // Save signatures
    if (Array.isArray(signatures)) {
      signatures.forEach(sig => {
        env.signatures.push({
          id: crypto.randomUUID(),
          signerId,
          documentId: sig.documentId,
          x: sig.x,
          y: sig.y,
          scale: sig.scale,
          base64Image: sig.base64Image
        });
      });
    }

    // Mark user as signed
    env.signers[signerIndex].status = 'signed';

    // Check if all are signed
    if (env.signers.every(s => s.status === 'signed')) {
      env.status = 'completed';
    }

    saveDb(db);

    return NextResponse.json({ success: true, message: 'Signed successfully' });
  } catch(e) {
    return NextResponse.json({ success: false, error: 'Sign failed' }, { status: 500 });
  }
}
