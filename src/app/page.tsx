"use client";

import { useState } from 'react';
import { UploadCloud, ShieldCheck, Link as LinkIcon, Lock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setShareLink(`${window.location.origin}/view/${data.filename}`);
      }
    } catch (e) {
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 user-select-none">
      <div className="absolute top-6 right-6 flex gap-4">
        <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors">
          <Lock className="w-4 h-4"/> Admin Login
        </Link>
      </div>

      <div className="max-w-xl w-full text-center mb-10">
        <ShieldCheck className="w-20 h-20 mx-auto text-indigo-500 mb-6" />
        <h1 className="text-4xl font-extrabold text-white mb-4">Secure File Sharing</h1>
        <p className="text-neutral-400">Generate an instant, view-only secure link for quick document review. No login required. Viewers cannot print, screenshot, or download.</p>
      </div>

      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {!shareLink ? (
          <div className="flex flex-col items-center">
            <div className="w-full border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-2xl p-10 text-center transition-colors relative cursor-pointer group mb-6">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={handleFileChange}
                accept="application/pdf,image/*,.doc,.docx"
              />
              <UploadCloud className="w-12 h-12 text-neutral-500 group-hover:text-indigo-400 mx-auto mb-4 transition-colors" />
              <p className="text-neutral-300 font-medium mb-1">
                {file ? file.name : "Drag and drop your file here"}
              </p>
              <p className="text-neutral-500 text-sm">
                PDF, Images, Word Docs
              </p>
            </div>

            <button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25"
            >
              {uploading ? 'Encrypting & Generating Link...' : 'Generate Secure Link'}
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl mb-6 font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5"/> Link Generated Successfully!
            </div>
            
            <label className="block text-left text-sm font-bold text-neutral-400 mb-2">Private Share Link</label>
            <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden mb-8">
              <div className="flex-1 p-4 text-left text-neutral-300 truncate font-mono text-sm">
                {shareLink}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(shareLink)}
                className="bg-neutral-800 hover:bg-neutral-700 px-6 font-bold text-white transition-colors flex items-center gap-2"
              >
                <LinkIcon className="w-4 h-4"/> Copy
              </button>
            </div>

            <button 
              onClick={() => { setShareLink(''); setFile(null); }}
              className="text-neutral-400 hover:text-white text-sm font-bold transition-colors"
            >
              Generate Another Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
