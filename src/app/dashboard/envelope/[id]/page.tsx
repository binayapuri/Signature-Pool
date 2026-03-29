import { getDb } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Link as LinkIcon, CheckCircle, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function EnvelopeDetails({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const db = getDb();
  const env = db.envelopes.find(e => e.id === p.id);

  if (!env) {
    return notFound();
  }

  // Get base URL (we assume request is on localhost for demo, or in production you use env vars)
  // Since it's a server component we don't naturally have window.location
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-200">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold mb-8 transition-colors w-max">
          <ArrowLeft className="w-5 h-5"/> Back to Dashboard
        </Link>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 shadow-xl">
          <div className="flex justify-between items-start mb-8 border-b border-neutral-800 pb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-2">{env.title}</h1>
              <p className="text-neutral-500">Created on {new Date(env.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-bold text-sm tracking-wider ${env.status === 'completed' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-amber-900/40 text-amber-400 border border-amber-800'}`}>
              {env.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-sm border-l-4 border-indigo-500 pl-3">Documents ({env.documents.length})</h2>
              <ul className="space-y-3">
                {env.documents.map((doc, idx) => (
                  <li key={doc.id} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center gap-3 text-sm font-medium">
                    <span className="bg-neutral-800 text-neutral-400 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                    {doc.originalName}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-sm border-l-4 border-indigo-500 pl-3">Signer Links</h2>
              <p className="text-sm text-neutral-400 mb-6">Send these unique links to your intended signers. They contain all documents.</p>
              
              <div className="space-y-6">
                {env.signers.map(signer => {
                  const link = `${baseUrl}/sign/${env.id}/${signer.id}`;
                  return (
                    <div key={signer.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-white tracking-wide">{signer.name}</span>
                        {signer.status === 'signed' ? <span className="text-green-500 flex items-center gap-1 text-xs font-bold bg-green-900/20 px-2 py-1 rounded"><CheckCircle className="w-4 h-4" /> Signed</span> : <span className="text-amber-500 flex items-center gap-1 text-xs font-bold bg-amber-900/20 px-2 py-1 rounded"><Clock className="w-4 h-4" /> Pending</span>}
                      </div>
                      
                      <div className="flex items-center border border-neutral-700 rounded-lg overflow-hidden relative">
                        <div className="flex-1 bg-neutral-900 p-3 pr-12 text-xs text-neutral-400 truncate font-mono">
                          {link}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
