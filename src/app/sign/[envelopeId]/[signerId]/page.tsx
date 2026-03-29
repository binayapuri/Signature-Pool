"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ShieldAlert, PenTool, Check, Image as ImageIcon, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignerFlow() {
  const { envelopeId, signerId } = useParams() as { envelopeId: string, signerId: string };
  const [envelope, setEnvelope] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDocId, setActiveDocId] = useState<string>('');
  
  // Signatures on the document
  const [placedSignatures, setPlacedSignatures] = useState<any[]>([]);
  
  // Modal State
  const [showSignModal, setShowSignModal] = useState(false);
  const [signType, setSignType] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  
  // Global submit state
  const [submitting, setSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Basic anti-theft protections
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && ['s', 'p'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    document.addEventListener('keydown', handleKeyDown);

    fetch(`/api/envelope/${envelopeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEnvelope(data.envelope);
          if (data.envelope.documents.length > 0) setActiveDocId(data.envelope.documents[0].id);
          
          const s = data.envelope.signers.find((s: any) => s.id === signerId);
          if (s?.status === 'signed') setIsDone(true);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [envelopeId, signerId]);

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000'; // Black ink as requested
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);

  const confirmSignature = () => {
    let base64Image = '';
    
    if (signType === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) base64Image = canvas.toDataURL('image/png');
    } else {
      // Create text signature on a canvas
      const cvs = document.createElement('canvas');
      cvs.width = 400; cvs.height = 100;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000'; // Black ink
        ctx.font = 'italic 48px "Times New Roman", serif'; // Signature style font
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(typedName, 200, 50);
        base64Image = cvs.toDataURL('image/png');
      }
    }

    if (base64Image) {
      setPlacedSignatures(prev => [...prev, {
        id: crypto.randomUUID(),
        documentId: activeDocId,
        x: 100, y: 100, scale: 1, base64Image
      }]);
    }
    
    setShowSignModal(false);
    setTypedName('');
    if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0,0,400,200);
  };

  const submitAllSignatures = async () => {
    if (placedSignatures.length === 0) return alert('You must place at least one signature.');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/envelope/${envelopeId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerId, signatures: placedSignatures })
      });
      const data = await res.json();
      if (data.success) {
        setIsDone(true);
      } else {
        alert(data.error);
      }
    } catch {
      alert('Error updating envelope');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Secure Environment...</div>;
  if (!envelope) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">Envelope not found or invalid link.</div>;

  const currentDoc = envelope.documents.find((d: any) => d.id === activeDocId);
  const currentSignatures = placedSignatures.filter(s => s.documentId === activeDocId);

  if (isDone) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-neutral-200 text-center">
        <Check className="w-24 h-24 text-green-500 mb-6 mx-auto" />
        <h1 className="text-4xl font-extrabold text-white mb-4">You're All Set!</h1>
        <p className="text-neutral-400">Your secure digital signatures have been recorded successfully. You may close this window.</p>
      </div>
    );
  }

  const signerInfo = envelope.signers.find((s: any) => s.id === signerId);

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col text-white user-select-none overflow-hidden">
      {/* Top Header */}
      <div className="w-full bg-neutral-950 border-b border-neutral-800 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-indigo-500" />
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-sm pointer-events-none">{envelope.title}</span>
            <span className="text-xs text-neutral-500 font-medium">Signing as: {signerInfo?.name}</span>
          </div>
        </div>

        <button 
          onClick={submitAllSignatures}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/20 transition-all disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Finish & Submit'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Document Sidebar */}
        <div className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col z-10 shrink-0">
          <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
             <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Documents</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {envelope.documents.map((doc: any, i: number) => {
              const isActive = doc.id === activeDocId;
              const hasSignatures = placedSignatures.some(s => s.documentId === doc.id);
              return (
                <button 
                  key={doc.id} onClick={() => setActiveDocId(doc.id)} 
                  className={`w-full text-left p-3 rounded-lg flex flex-col text-sm border font-medium transition-all ${isActive ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900 border-transparent text-neutral-400 hover:bg-neutral-800'}`}
                >
                  <span className="truncate block w-full">{doc.originalName}</span>
                  {hasSignatures && <span className="text-[10px] mt-1 bg-black/30 px-2 py-0.5 rounded-full self-start">Signed</span>}
                </button>
              );
            })}
          </div>
          
          <div className="p-4 border-t border-neutral-800">
             <button onClick={() => setShowSignModal(true)} className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
               <PenTool className="w-4 h-4"/> Add Signature
             </button>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-auto bg-black relative flex items-start justify-center p-8 custom-scrollbar">
          {currentDoc && (
            <div className="relative bg-white shadow-2xl flex-shrink-0 mb-32 group" style={{ width: '850px', minHeight: '1100px' }}>
              
              {/* Interaction Blocker Canvas to prevent native document interaction while allowing our custom overlays */}
              <div className="absolute inset-0 z-10" />

              {/* PDF Or Image Underlying Layer */}
              {currentDoc.filename.toLowerCase().endsWith('.pdf') ? (
                <embed src={`/api/doc/${currentDoc.filename}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-[850px] min-h-[1100px] h-[100vh]" />
              ) : (
                <img src={`/api/doc/${currentDoc.filename}`} className="w-full h-auto object-contain pointer-events-none" />
              )}
              
              {/* Overlay for Draggable Signatures */}
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                {currentSignatures.map((sig, i) => (
                  <motion.div 
                    key={sig.id}
                    drag
                    dragMomentum={false}
                    className="absolute cursor-move pointer-events-auto group/sig"
                    style={{ x: sig.x, y: sig.y, scale: sig.scale }}
                    onDragEnd={(_, info) => {
                      setPlacedSignatures(prev => prev.map(s => s.id === sig.id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s));
                    }}
                  >
                    <div className="border border-transparent group-hover/sig:border-indigo-500 group-hover/sig:bg-indigo-500/10 transition-colors p-2 rounded relative">
                      <img src={sig.base64Image} className="max-w-[300px] opacity-90 filter drop-shadow hover:opacity-100 pointer-events-none" />
                      
                      {/* Zoom Controls Hover Menu */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 px-2 py-1 rounded-lg flex items-center gap-2 opacity-0 group-hover/sig:opacity-100 transition-opacity shadow-lg">
                         <button onClick={() => setPlacedSignatures(p => p.map(s => s.id === sig.id ? {...s, scale: Math.max(0.5, s.scale - 0.1)} : s))} className="p-1 hover:text-indigo-400"><Minimize2 className="w-4 h-4" /></button>
                         <span className="text-xs font-mono w-8 text-center">{Math.round(sig.scale * 100)}%</span>
                         <button onClick={() => setPlacedSignatures(p => p.map(s => s.id === sig.id ? {...s, scale: Math.min(2.5, s.scale + 0.1)} : s))} className="p-1 hover:text-indigo-400"><Maximize2 className="w-4 h-4" /></button>
                         <div className="w-px h-4 bg-neutral-700 mx-1" />
                         <button onClick={() => setPlacedSignatures(p => p.filter(s => s.id !== sig.id))} className="text-red-400 text-xs font-bold hover:text-red-300 ml-1">DEL</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              
              <h2 className="text-2xl font-bold mb-4 text-white">Create Signature</h2>
              <div className="flex bg-neutral-950 p-1 mb-6 rounded-xl border border-neutral-800 relative z-0">
                <button onClick={() => setSignType('draw')} className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${signType === 'draw' ? 'text-white bg-neutral-800 rounded-lg shadow' : 'text-neutral-500'}`}>Draw (Black Ink)</button>
                <button onClick={() => setSignType('type')} className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${signType === 'type' ? 'text-white bg-neutral-800 rounded-lg shadow' : 'text-neutral-500'}`}>Type Name</button>
              </div>

              {signType === 'draw' ? (
                <div className="bg-white rounded-xl mb-6 overflow-hidden shadow-inner relative" onMouseLeave={stopDrawing}>
                  <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={200} 
                    className="w-full h-[200px] cursor-crosshair touch-none"
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                  />
                  <button onClick={() => { if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0,0,400,200) }} className="absolute bottom-2 right-2 text-xs font-bold text-neutral-400 hover:text-black transition-colors rounded bg-neutral-100 px-2 py-1">Clear</button>
                </div>
              ) : (
                <div className="mb-6">
                   <input 
                     type="text" value={typedName} onChange={(e) => setTypedName(e.target.value)}
                     placeholder="Type your full name"
                     className="w-full bg-white text-black font-[Times] italic text-3xl py-8 px-6 rounded-xl border-none focus:outline-none focus:ring-4 focus:ring-indigo-500/50 text-center shadow-inner"
                   />
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={() => setShowSignModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors font-bold">Cancel</button>
                <button onClick={confirmSignature} disabled={signType === 'type' && !typedName} className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50">Create & Place</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
