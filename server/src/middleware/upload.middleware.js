import multer from 'multer';

const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

// Memory storage only — the file is parsed for its text and discarded, never
// written to disk or persisted anywhere.
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.has(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type — upload a PDF, DOCX, or TXT file'));
  },
}).single('resume');
