import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import Editor, { DiffEditor, type Monaco, type MonacoDiffEditor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import codeViewerStyles from './CodeViewer.module.scss';

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

interface CodeCommentRange {
  startLine?: number;
  endLine?: number;
  authorRole: string;
}

interface SelectedLineRange {
  startLine: number;
  endLine: number;
}

interface SelectionPayload {
  startLineNumber: number;
  endLineNumber: number;
}

interface CodeViewerProps {
  value: string;
  originalValue?: string;
  language?: string;
  isDiff?: boolean;
  comments?: CodeCommentRange[];
  onLineClick?: (range: SelectedLineRange) => void;
  onLineContextMenu?: (range: SelectionPayload) => void;
  canComment?: boolean;
}

const CodeViewer = memo(
  ({
    value,
    originalValue,
    language,
    isDiff = false,
    comments = [],
    onLineClick,
    onLineContextMenu,
    canComment = false,
  }: CodeViewerProps) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const decorationsRef = useRef<editor.IEditorDecorationsCollection | string[] | null>(null);
    const widgetRef = useRef<editor.IContentWidget | null>(null);
    const [selectedRange, setSelectedRange] = useState<SelectedLineRange | null>(null);

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

    const latestProps = useRef({
      comments,
      onLineClick,
      onLineContextMenu,
      canComment,
    });

    useEffect(() => {
      latestProps.current = {
        comments,
        onLineClick,
        onLineContextMenu,
        canComment,
      };
    }, [comments, onLineClick, onLineContextMenu, canComment]);

    const rootEditorRef = useRef<editor.IStandaloneCodeEditor | MonacoDiffEditor | null>(null);

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
      const rangeMap = new Map<string, SelectedLineRange & { isAI: boolean }>();

      latestProps.current.comments.forEach((c) => {
        if (c.startLine === undefined || c.endLine === undefined) {
          return;
        }

        const key = `${c.startLine}-${c.endLine}`;

        if (!rangeMap.has(key)) {
          rangeMap.set(key, {
            startLine: c.startLine,
            endLine: c.endLine,
            isAI: c.authorRole === 'AI',
          });
        }
      });

      return [...rangeMap.values()];
    }, []);

    const removeCommentWidget = useCallback((codeEditor: editor.IStandaloneCodeEditor) => {
      if (widgetRef.current) {
        try {
          codeEditor.removeContentWidget(widgetRef.current);
        } catch (err: unknown) {
          console.error('Widget removal error:', err);
        }

        widgetRef.current = null;
      }
    }, []);

    const showCommentWidget = useCallback(
      (codeEditor: editor.IStandaloneCodeEditor, monaco: Monaco, lineNumber: number) => {
        removeCommentWidget(codeEditor);
        const domNode = document.createElement('div');
        domNode.className = codeViewerStyles.commentWidget;
        domNode.textContent = 'Комментировать';

        const handleCommentAction = (e: MouseEvent | TouchEvent): void => {
          e.preventDefault();
          e.stopPropagation();
          const selection = codeEditor.getSelection();

          if (selection && latestProps.current.onLineContextMenu) {
            latestProps.current.onLineContextMenu({
              startLineNumber: selection.startLineNumber,
              endLineNumber: selection.endLineNumber,
            });
          }

          removeCommentWidget(codeEditor);
        };

        domNode.onmousedown = handleCommentAction;
        domNode.ontouchstart = handleCommentAction;

        const widget = {
          getId: () => 'comment-widget',
          getDomNode: () => domNode,
          getPosition: () => ({
            position: {
              lineNumber,
              column: 1,
            },
            preference: monaco.editor.ContentWidgetPositionPreference
              ? lineNumber <= 2
                ? [
                    monaco.editor.ContentWidgetPositionPreference.BELOW,
                    monaco.editor.ContentWidgetPositionPreference.ABOVE,
                  ]
                : [
                    monaco.editor.ContentWidgetPositionPreference.ABOVE,
                    monaco.editor.ContentWidgetPositionPreference.BELOW,
                  ]
              : [1, 2],
          }),
        };

        codeEditor.addContentWidget(widget);
        widgetRef.current = widget;
      },
      [removeCommentWidget]
    );

    const injectRangeStyles = useCallback(
      (ranges: Array<SelectedLineRange & { isAI: boolean }>, selected: SelectedLineRange | null) => {
        let styleEl = document.getElementById('code-viewer-range-styles');

        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'code-viewer-range-styles';
          document.head.appendChild(styleEl);
        }

        let css = '';

        ranges.forEach((range, index) => {
          const isAI = range.isAI;
          const isSelected = selected && selected.startLine === range.startLine && selected.endLine === range.endLine;
          let color;

          if (isAI) {
            color = isSelected ? AI_RANGE_COLOR_SELECTED : AI_RANGE_COLOR;
          } else {
            const colorIdx = index % RANGE_COLORS.length;

            color = isSelected
              ? (RANGE_COLORS_SELECTED[colorIdx] ?? AI_RANGE_COLOR_SELECTED)
              : (RANGE_COLORS[colorIdx] ?? AI_RANGE_COLOR);
          }

          css += `.range-idx-${index} { background-color: ${color} !important; }\n`;
        });

        styleEl.textContent = css;
      },
      []
    );

    const updateDecorations = useCallback(() => {
      if (!editorRef.current || !monacoRef.current) return;
      const uniqueRanges = getUniqueRanges();
      const newDecorations: editor.IModelDeltaDecoration[] = [];

      uniqueRanges.forEach((range, index) => {
        const isAI = range.isAI;

        newDecorations.push({
          range: new monacoRef.current.Range(range.startLine, 1, range.endLine, 1),
          options: {
            isWholeLine: true,
            className: [codeViewerStyles.commentLine, `range-idx-${index}`].join(' '),
            overviewRuler: {
              color: isAI ? '#8b5cf6' : '#6366f1',
              position: 1,
            },
          },
        });

        newDecorations.push({
          range: new monacoRef.current.Range(range.startLine, 1, range.startLine, 1),
          options: {
            glyphMarginClassName: isAI
              ? [codeViewerStyles.commentGlyph, codeViewerStyles.isAi].join(' ')
              : codeViewerStyles.commentGlyph,
          },
        });
      });

      injectRangeStyles(uniqueRanges, selectedRange);

      if (editorRef.current.createDecorationsCollection) {
        if (decorationsRef.current && !Array.isArray(decorationsRef.current)) {
          decorationsRef.current.set(newDecorations);
        } else {
          decorationsRef.current = editorRef.current.createDecorationsCollection(newDecorations);
        }
      } else {
        const oldDecorations = Array.isArray(decorationsRef.current) ? decorationsRef.current : [];
        decorationsRef.current = editorRef.current.deltaDecorations(oldDecorations, newDecorations);
      }
    }, [selectedRange, getUniqueRanges, injectRangeStyles]);

    const handleEditorDidMount = (
      mountedEditor: editor.IStandaloneCodeEditor | MonacoDiffEditor,
      monaco: Monaco
    ): void => {
      rootEditorRef.current = mountedEditor;

      const mainEditor = 'getModifiedEditor' in mountedEditor ? mountedEditor.getModifiedEditor() : mountedEditor;

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

            if (selection && latestProps.current.onLineContextMenu) {
              latestProps.current.onLineContextMenu({
                startLineNumber: selection.startLineNumber,
                endLineNumber: selection.endLineNumber,
              });
            }
          },
        });
      }

      mainEditor.onMouseDown((e) => {
        const isGutter = e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN;
        const isContent = e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT;

        if ((isGutter || isContent) && e.target.position) {
          const lineNum = e.target.position.lineNumber;
          const range = getUniqueRanges().find((r) => lineNum >= r.startLine && lineNum <= r.endLine);

          if (range && latestProps.current.onLineClick) {
            const newRange = {
              startLine: range.startLine,
              endLine: range.endLine,
            };

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

    const editorOptions = useMemo(
      () => ({
        readOnly: true,
        minimap: {
          enabled: false,
        },
        fontSize: isNarrowScreen ? 12 : 14,
        fontWeight: '400',
        wordWrap: 'off' as const,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        glyphMargin: true,
        glyphMarginWidth: 16,
        lineDecorationsWidth: 8,
        lineNumbersMinChars: 2,
        renderLineHighlight: 'none' as const,
        contextmenu: canComment,
        scrollbar: {
          alwaysConsumeMouseWheel: !isNarrowScreen,
        },
      }),
      [canComment, isNarrowScreen]
    );

    const calculatedHeight = useMemo(() => {
      const lineCount = (value || '').split('\n').length;
      const height = lineCount * 19 + 40;

      return Math.min(Math.max(height, 400), 1000);
    }, [value]);

    return (
      <div
        className={codeViewerStyles.container}
        style={{
          height: `${calculatedHeight}px`,
        }}
      >
        {isDiff ? (
          <DiffEditor
            {...(language !== undefined ? { language } : {})}
            {...(originalValue !== undefined ? { original: originalValue } : {})}
            modified={value}
            theme="vs-dark"
            options={editorOptions}
            onMount={handleEditorDidMount}
          />
        ) : (
          <Editor
            {...(language !== undefined ? { language } : {})}
            value={value}
            theme="vs-dark"
            options={editorOptions}
            onMount={handleEditorDidMount}
          />
        )}
      </div>
    );
  }
);

export default CodeViewer;
