import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const MAX_RESUME_CHARS = 6000; // keep prompts bounded regardless of how long the source doc is

export async function extractResumeText(buffer, mimetype) {
  let text;

  if (mimetype === 'application/pdf') {
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (mimetype === 'text/plain') {
    text = buffer.toString('utf-8');
  } else {
    const err = new Error('Unsupported file type — upload a PDF, DOCX, or TXT file');
    err.status = 400;
    err.publicMessage = err.message;
    throw err;
  }

  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    const err = new Error("Couldn't extract any text from that file — it may be a scanned image without a text layer");
    err.status = 400;
    err.publicMessage = err.message;
    throw err;
  }

  return cleaned.slice(0, MAX_RESUME_CHARS);
}
