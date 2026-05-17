import React from 'react';
import Editor from '@monaco-editor/react';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import './CodeEditor.css';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'shell', label: 'Shell' },
  { value: 'xml', label: 'XML' },
  { value: 'plaintext', label: 'Plain Text' }
];

const CodeEditor = ({ value, onChange, language, onLanguageChange }) => {
  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <ReviewDropdown
          label="Язык:"
          options={LANGUAGES}
          value={language}
          onChange={onLanguageChange}
        />
      </div>
      <div className="code-editor-wrapper">
        <Editor
          height="350px"
          language={language}
          value={value}
          onChange={onChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontWeight: '400',
            wordWrap: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbersMinChars: 3
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
