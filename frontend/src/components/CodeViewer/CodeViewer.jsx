import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import './CodeViewer.css';


const RANGE_COLORS = [
  'rgba(99, 102, 241, 0.15)',
  'rgba(234, 179, 8, 0.15)',
  'rgba(34, 197, 94, 0.15)',
  'rgba(244, 63, 94, 0.15)',
  'rgba(168, 85, 247, 0.15)',
  'rgba(6, 182, 212, 0.15)',
];

const RANGE_COLORS_SELECTED = [
  'rgba(99, 102, 241, 0.35)',
  'rgba(234, 179, 8, 0.35)',
  'rgba(34, 197, 94, 0.35)',
  'rgba(244, 63, 94, 0.35)',
  'rgba(168, 85, 247, 0.35)',
  'rgba(6, 182, 212, 0.35)',
];

const AI_RANGE_COLOR = 'rgba(139, 92, 246, 0.12)';
const AI_RANGE_COLOR_SELECTED = 'rgba(139, 92, 246, 0.3)';

const CodeViewer = memo(({
  value,
  originalValue,
  language,
  isDiff = false,
  comments = [],
  onLineClick,
  onLineContextMenu,
  canComment = false
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef(null);
  const widgetRef = useRef(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [isNarrowScreen, setIsNarrowScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 500 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth <= 500);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const latestProps = useRef({ comments, onLineClick, onLineContextMenu, canComment });
  useEffect(() => {
    latestProps.current = { comments, onLineClick, onLineContextMenu, canComment };
  }, [comments, onLineClick, onLineContextMenu, canComment]);

  const rootEditorRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rootEditorRef.current) {
        try {
          rootEditorRef.current.dispose();
        } catch {
          console.warn('Editor disposal failed, possibly already disposed');
        }
      }
    };
  }, []);

  const getUniqueRanges = useCallback(() => {
    const rangeMap = new Map();
    latestProps.current.comments.forEach(c => {
      const key = `${c.startLine}-${c.endLine}`;
      if (!rangeMap.has(key)) {
        rangeMap.set(key, { startLine: c.startLine, endLine: c.endLine, isAI: c.authorRole === 'AI' });
      }
    });
    return [...rangeMap.values()];
  }, []);

  const removeCommentWidget = useCallback((editor) => {
    if (widgetRef.current && editor) {
      try {
        editor.removeContentWidget(widgetRef.current);
      } catch (err) {
        console.error('Widget removal error:', err);
      }
      widgetRef.current = null;
    }
  }, []);

  const showCommentWidget = useCallback((editor, monaco, lineNumber) => {
    removeCommentWidget(editor);

    const domNode = document.createElement('div');
    domNode.className = 'code-viewer-comment-widget';
    domNode.textContent = 'Комментировать';

    domNode.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const selection = editor.getSelection();
      if (latestProps.current.onLineContextMenu) {
        latestProps.current.onLineContextMenu({
          startLineNumber: selection.startLineNumber,
          endLineNumber: selection.endLineNumber
        });
      }
      removeCommentWidget(editor);
    };

    const widget = {
      getId: () => 'comment-widget',
      getDomNode: () => domNode,
      getPosition: () => ({
        position: { lineNumber, column: 1 },
        preference: monaco.editor.ContentWidgetPositionPreference
          ? lineNumber <= 2
            ? [
              monaco.editor.ContentWidgetPositionPreference.BELOW,
              monaco.editor.ContentWidgetPositionPreference.ABOVE
            ]
            : [
              monaco.editor.ContentWidgetPositionPreference.ABOVE,
              monaco.editor.ContentWidgetPositionPreference.BELOW
            ]
          : [1, 2]
      })
    };

    editor.addContentWidget(widget);
    widgetRef.current = widget;
  }, [removeCommentWidget]);

  const injectRangeStyles = useCallback((ranges, selected) => {
    let styleEl = document.getElementById('code-viewer-range-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'code-viewer-range-styles';
      document.head.appendChild(styleEl);
    }

    let css = '';
    ranges.forEach((range, index) => {
      const isAI = range.isAI;
      const isSelected = selected &&
        selected.startLine === range.startLine &&
        selected.endLine === range.endLine;

      let color;
      if (isAI) {
        color = isSelected ? AI_RANGE_COLOR_SELECTED : AI_RANGE_COLOR;
      } else {
        const colorIdx = index % RANGE_COLORS.length;
        color = isSelected ? RANGE_COLORS_SELECTED[colorIdx] : RANGE_COLORS[colorIdx];
      }

      css += `.range-idx-${index} { background-color: ${color} !important; }\n`;
    });
    styleEl.textContent = css;
  }, []);

  const updateDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const uniqueRanges = getUniqueRanges();
    const newDecorations = [];

    uniqueRanges.forEach((range, index) => {
      const isAI = range.isAI;

      newDecorations.push({
        range: new monacoRef.current.Range(range.startLine, 1, range.endLine, 1),
        options: {
          isWholeLine: true,
          className: `code-viewer-comment-line range-idx-${index}`,
          overviewRuler: { color: isAI ? '#8b5cf6' : '#6366f1', position: 1 }
        }
      });

      newDecorations.push({
        range: new monacoRef.current.Range(range.startLine, 1, range.startLine, 1),
        options: {
          glyphMarginClassName: isAI ? 'code-viewer-comment-glyph code-viewer-comment-glyph--ai' : 'code-viewer-comment-glyph',
        }
      });
    });

    injectRangeStyles(uniqueRanges, selectedRange);

    if (editorRef.current.createDecorationsCollection) {
      if (decorationsRef.current && decorationsRef.current.set) {
        decorationsRef.current.set(newDecorations);
      } else {
        decorationsRef.current = editorRef.current.createDecorationsCollection(newDecorations);
      }
    } else {
      const oldDecorations = Array.isArray(decorationsRef.current) ? decorationsRef.current : [];
      decorationsRef.current = editorRef.current.deltaDecorations(oldDecorations, newDecorations);
    }
  }, [selectedRange, getUniqueRanges, injectRangeStyles]);

  const handleEditorDidMount = (editor, monaco) => {
    rootEditorRef.current = editor;
    const isDiffEditor = !!editor.getModifiedEditor;
    const mainEditor = isDiffEditor ? editor.getModifiedEditor() : editor;

    editorRef.current = mainEditor;
    monacoRef.current = monaco;

    if (latestProps.current.canComment) {
      mainEditor.addAction({
        id: 'add-comment-action',
        label: 'Комментировать',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        precondition: 'editorTextFocus',
        run: (ed) => {
          const selection = ed.getSelection();
          if (latestProps.current.onLineContextMenu) {
            latestProps.current.onLineContextMenu({
              startLineNumber: selection.startLineNumber,
              endLineNumber: selection.endLineNumber
            });
          }
        }
      });
    }

    mainEditor.onMouseDown((e) => {
      const isGutter = e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN;
      const isContent = e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT;

      if ((isGutter || isContent) && e.target.position) {
        const lineNum = e.target.position.lineNumber;
        const range = getUniqueRanges().find(
          r => lineNum >= r.startLine && lineNum <= r.endLine
        );
        if (range && latestProps.current.onLineClick) {
          const newRange = { startLine: range.startLine, endLine: range.endLine };
          setSelectedRange(newRange);
          latestProps.current.onLineClick(newRange);
        }
      }
    });

    mainEditor.onDidChangeCursorSelection((e) => {
      if (!latestProps.current.canComment) return;
      const sel = e.selection;
      if (!sel.isEmpty()) {
        showCommentWidget(mainEditor, monaco, sel.startLineNumber);
      } else {
        removeCommentWidget(mainEditor);
      }
    });

    mainEditor.onMouseUp(() => {
      if (!latestProps.current.canComment) return;
      const sel = mainEditor.getSelection();
      if (sel && !sel.isEmpty()) {
        showCommentWidget(mainEditor, monaco, sel.startLineNumber);
      }
    });

    mainEditor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Escape) {
        removeCommentWidget(mainEditor);
      }
    });

    updateDecorations();
  };

  useEffect(() => {
    if (editorRef.current) {
      updateDecorations();
    }
  }, [comments, selectedRange, updateDecorations]);

  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== value) {
        model.setValue(value);
      }
    }
  }, [value]);

  const editorOptions = useMemo(() => ({
    readOnly: true,
    minimap: { enabled: false },
    fontSize: isNarrowScreen ? 12 : 14,
    fontWeight: '400',
    wordWrap: 'off',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    glyphMargin: true,
    glyphMarginWidth: 16,
    lineDecorationsWidth: 8,
    lineNumbersMinChars: 2,
    renderLineHighlight: 'none',
    contextmenu: canComment,
    scrollbar: {
      alwaysConsumeMouseWheel: !isNarrowScreen
    }
  }), [canComment, isNarrowScreen]);

  const calculatedHeight = useMemo(() => {
    const lineCount = (value || '').split('\n').length;
    const height = lineCount * 19 + 40;
    return Math.min(Math.max(height, 400), 1000);
  }, [value]);

  return (
    <div className="code-viewer-container" style={{ height: `${calculatedHeight}px` }}>
      {isDiff ? (
        <DiffEditor
          language={language}
          original={originalValue}
          modified={value}
          theme="vs-dark"
          options={editorOptions}
          onMount={handleEditorDidMount}
        />
      ) : (
        <Editor
          language={language}
          value={value}
          theme="vs-dark"
          options={editorOptions}
          onMount={handleEditorDidMount}
        />
      )}
    </div>
  );
});

export default CodeViewer;
