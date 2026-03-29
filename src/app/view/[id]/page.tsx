"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, Download, PenTool, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentViewer() {
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [ext, setExt] = useState('');
  const [signatures, setSignatures] = useState<any[]>([]);
  
  const [showSignModal, setShowSignModal] = useState(false);
  const [signType, setSignType] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Basic anti-theft UI blocks
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && ['s', 'p'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    document.addEventListener('keydown', handleKeyDown);

    const parts = id.split('.');
    setExt(parts.length > 1 ? `.${parts[parts.length - 1]}` : '');

    // Fetch existing signatures
    fetch(`/api/sign?documentId=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setSignatures(d.signatures);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [id]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);

  const confirmSignature = () => {
    let base64Image = '';
    if (signType === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) base64Image = canvas.toDataURL('image/png');
    } else {
      const cvs = document.createElement('canvas');
      cvs.width = 400; cvs.height = 100;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.font = 'italic 48px "Times New Roman", serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(typedName, 200, 50);
        base64Image = cvs.toDataURL('image/png');
      }
    }

    if (base64Image) {
       setSignatures(prev => [...prev, {
          id: crypto.randomUUID(),
          x: 100, y: 100, scale: 1, base64Image
       }]);
    }
    
    setShowSignModal(false);
    setTypedName('');
  };

  const handleSaveSignatures = async () => {
    if (signatures.length === 0) return alert('No signatures to save.');
    setSaving(true);
    try {
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id, signatures })
      });
      const data = await res.json();
      if (data.success) {
         alert('Signatures successfully saved!');
      } else {
         alert(data.error);
      }
    } catch {
       alert('Error saving signatures');
    } finally {
       setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex justify-center items-center text-indigo-400 font-bold">Loading Secure View...</div>;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col text-white user-select-none">
      
      {/* Top Header Controls */}
      <div className="bg-neutral-950 border-b border-neutral-800 p-4 flex items-center justify-between z-10 shrink-0">
         <div className="flex items-center gap-3">
           <ShieldCheck className="w-8 h-8 text-indigo-500" />
           <div>
             <h1 className="font-extrabold tracking-wider">Secure Document Review</h1>
             <p className="text-xs text-neutral-500 font-medium font-mono">ID: {id}</p>
           </div>
         </div>

         <div className="flex items-center gap-3">
           {signatures.length > 0 && (
              <button onClick={handleSaveSignatures} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2 rounded-lg transition-colors shadow-lg disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Signatures'}
              </button>
           )}
           <button onClick={() => setShowSignModal(true)} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 font-bold px-4 py-2 rounded-lg transition-colors border border-neutral-700">
             <PenTool className="w-4 h-4"/> Sign
           </button>
         </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 overflow-auto bg-black flex justify-center p-8 custom-scrollbar relative">
         <div className="relative bg-white shadow-2xl flex-shrink-0 group pointer-events-auto" style={{ width: '850px', minHeight: '1100px' }}>
             
             {/* Interaction Blocker - stops native save as image, right click */}
             <div className="absolute inset-0 z-10" />

             {ext.toLowerCase() === '.pdf' ? (
               <embed src={`/api/doc/${id}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-[850px] min-h-[1100px] h-[100vh]" />
             ) : (
               <img src={`/api/doc/${id}`} className="w-full h-auto object-contain pointer-events-none" />
             )}
             
             {/* Draggable Signatures */}
             <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                {signatures.map((sig, i) => (
                  <motion.div 
                    key={sig.id}
                    drag
                    dragMomentum={false}
                    className="absolute cursor-move pointer-events-auto group/sig"
                    style={{ x: sig.x, y: sig.y, scale: sig.scale }}
                    onDragEnd={(_, info) => {
                      setSignatures(prev => prev.map(s => s.id === sig.id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s));
                    }}
                  >
                    <div className="hover:border-indigo-500 border border-transparent hover:bg-indigo-500/10 transition-colors p-2 rounded relative group-hover/sig:z-50">
                      <img src={sig.base64Image} className="max-w-[300px] opacity-90 drop-shadow hover:opacity-100 pointer-events-none" />
                      
                      {/* Zoom Matrix Menu */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 px-2 py-1 rounded-lg flex items-center gap-2 opacity-0 group-hover/sig:opacity-100 transition-opacity shadow-lg">
                         <button onClick={() => setSignatures(p => p.map(s => s.id === sig.id ? {...s, scale: Math.max(0.5, s.scale - 0.1)} : s))} className="p-1 hover:text-indigo-400"><Minimize2 className="w-4 h-4" /></button>
                         <span className="text-xs font-mono w-8 text-center text-white">{Math.round(sig.scale * 100)}%</span>
                         <button onClick={() => setSignatures(p => p.map(s => s.id === sig.id ? {...s, scale: Math.min(2.5, s.scale + 0.1)} : s))} className="p-1 hover:text-indigo-400"><Maximize2 className="w-4 h-4" /></button>
                         <div className="w-px h-4 bg-neutral-700 mx-1" />
                         <button onClick={() => setSignatures(p => p.filter(s => s.id !== sig.id))} className="text-red-400 text-xs font-bold hover:text-red-300 ml-1">DEL</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>

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
                    width={400} height={200} 
                    className="w-full h-[200px] cursor-crosshair touch-none"
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                  />
                  <button onClick={() => { if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0,0,400,200) }} className="absolute bottom-2 right-2 text-xs font-bold text-neutral-400 hover:text-black transition-colors bg-neutral-100 px-2 py-1 rounded">Clear</button>
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
