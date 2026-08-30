import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileCheck2, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';

const ACCEPTED = '.pdf,.docx,.txt';

export default function ResumeUpload({ onExtracted }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  async function upload(file) {
    setStatus('uploading');
    setError('');
    setFileName(file.name);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const { data } = await apiClient.post('/profile/resume', formData);
      onExtracted(data.profile.resume_summary);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Could not read that file');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div>
      <motion.button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
          dragActive
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-charcoal-600 bg-charcoal-800 hover:border-amber-500/50'
        }`}
      >
        <AnimatePresence mode="wait">
          {status === 'uploading' ? (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="mx-auto mb-1 animate-spin text-amber-400" size={22} />
              <p className="text-sm text-slate-300">Reading {fileName}…</p>
            </motion.div>
          ) : status === 'done' ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-panel-hr"
            >
              <FileCheck2 className="mx-auto mb-1" size={22} />
              <p className="text-sm">{fileName} — resume text extracted below</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadCloud className="mx-auto mb-1 text-slate-400" size={22} />
              <p className="text-sm text-slate-300">Drop your resume here, or click to upload</p>
              <p className="mt-0.5 text-xs text-slate-500">PDF, DOCX, or TXT</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />

      {error && <p className="mt-2 animate-shake text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
