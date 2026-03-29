import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const db = getDb();
    const env = db.envelopes.find(e => e.id === p.id);
    
    if (!env) {
      return NextResponse.json({ success: false, error: 'Envelope not found' }, { status: 404 });
    }

    // Return the envelope safely
    return NextResponse.json({ success: true, envelope: env });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
