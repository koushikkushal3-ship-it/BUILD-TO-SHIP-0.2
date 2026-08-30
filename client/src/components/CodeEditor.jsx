import Editor from '@monaco-editor/react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'sql', label: 'SQL' },
];

// Blocking Ctrl+V/C/X as no-op keybindings works regardless of how Monaco's
// clipboard integration behaves across browsers — a document-level 'paste'
// listener alone isn't reliable here since Monaco can read the clipboard via
// its own command rather than a native paste event.
function handleMount(editor, monaco) {
  const noop = () => {};
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, noop);
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, noop);
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, noop);
  editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, noop);
}

export default function CodeEditor({ value, onChange, language, onLanguageChange, disabled }) {
  return (
    <div className="overflow-hidden rounded-lg border border-charcoal-600">
      <div className="flex items-center justify-between border-b border-charcoal-600 bg-charcoal-800 px-3 py-1.5">
        <span className="text-xs text-slate-500">Code editor — copy/paste disabled</span>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={disabled}
          className="rounded bg-charcoal-700 px-2 py-1 text-xs text-slate-300 outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <Editor
        height="340px"
        theme="vs-dark"
        language={language}
        value={value}
        onChange={(v) => onChange(v || '')}
        onMount={handleMount}
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly: disabled,
          contextmenu: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
