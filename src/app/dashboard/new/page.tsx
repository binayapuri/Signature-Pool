"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, UploadCloud, FileText } from 'lucide-react';

export default function NewEnvelope() {
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [signers, setSigners] = useState([{ name: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const updateSigner = (index: number, field: string, value: string) => {
    const updated = [...signers];
    updated[index] = { ...updated[index], [field]: value };
    setSigners(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert('Please attach at least one document.');
    if (signers.some(s => !s.name || !s.email)) return alert('All signers must have name and email.');

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title || 'Untitled');
    formData.append('signers', JSON.stringify(signers));
    files.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/envelope', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/envelope/${data.envelopeId}`);
      } else {
        alert(data.error);
      }
    } catch {
      alert('Error creating envelope');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-200 flex justify-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-extrabold text-white mb-8">Create New Envelope</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-xl">
          
          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2">Envelope Title</label>
            <input 
              type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sales Contract, Non-Disclosure Agreement"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2">Documents</label>
            <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center relative hover:border-indigo-500 transition-colors">
              <input type="file" multiple required onChange={handleFileChange} accept="application/pdf,image/*,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <UploadCloud className="w-10 h-10 text-neutral-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Drag & drop files or click to browse</p>
              {files.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 relative z-10 pointer-events-none">
                  {files.map((f, i) => (
                    <div key={i} className="bg-neutral-800 p-2 rounded flex items-center gap-2 text-sm text-white">
                      <FileText className="w-4 h-4 text-indigo-400"/> {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2">Signers</label>
            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input type="text" required placeholder="Name" value={signer.name} onChange={(e) => updateSigner(index, 'name', e.target.value)} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3" />
                  <input type="email" required placeholder="Email address" value={signer.email} onChange={(e) => updateSigner(index, 'email', e.target.value)} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3" />
                  {signers.length > 1 && (
                    <button type="button" onClick={() => setSigners(signers.filter((_, i) => i !== index))} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl">
                      <X className="w-5 h-5"/>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSigners([...signers, { name: '', email: '' }])} className="mt-4 text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <Plus className="w-4 h-4"/> Add Another Signer
            </button>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex justify-end">
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Envelope'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
