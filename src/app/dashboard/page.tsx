import { getDb } from '@/lib/db';
import Link from 'next/link';
import { Plus, CheckCircle, Clock, FileText, Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const db = getDb();
  const sortedEnvelopes = db.envelopes.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-extrabold text-white">Your Secure Envelopes</h1>
          <Link 
            href="/dashboard/new" 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5"/> New Envelope
          </Link>
        </div>

        {sortedEnvelopes.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-16 text-center shadow-xl">
             <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
             <h2 className="text-xl font-bold mb-2">No envelopes yet</h2>
             <p className="text-neutral-500">Create your first envelope to collect secure signatures.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEnvelopes.map(env => (
              <div key={env.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-white truncate pr-4">{env.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${env.status === 'completed' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-amber-900/40 text-amber-400 border border-amber-800'}`}>
                    {env.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm text-neutral-500 mb-6 flex-grow">{env.documents.length} document(s)</p>
                
                <div className="border-t border-neutral-800 pt-4 mt-auto">
                  <h4 className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-wider">Signers</h4>
                  <div className="space-y-3">
                    {env.signers.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[150px]">{s.name} <span className="text-neutral-500 text-xs">({s.email})</span></span>
                        {s.status === 'signed' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <Link 
                    href={`/dashboard/envelope/${env.id}`}
                    className="block w-full text-center py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details & Links
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
