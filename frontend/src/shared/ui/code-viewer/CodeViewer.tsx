import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import Editor, { DiffEditor, type Monaco, type MonacoDiffEditor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useCodeEditorTheme } from '@/shared/lib/theme';
import CodeToolbar from '@/shared/ui/code-toolbar';
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

interface DecoratedLineRange extends SelectedLineRange {
  isAI: boolean;
}

interface SelectionPayload {
  startLineNumber: number;
  endLineNumber: number;
}

interface CodeViewerProps {
  value: string;
  originalValue?: string;
  language?: string;
  filePath?: string;
  isDiff?: boolean;
  comments?: CodeCommentRange[];
  onLineClick?: (range: SelectedLineRange) => void;
  onLineContextMenu?: (range: SelectionPayload) => void;
  canComment?: boolean;
}

const isSameRange = (left: SelectedLineRange | null, right: SelectedLineRange): boolean =>
  left?.startLine === right.startLine && left.endLine === right.endLine;

const getSelectableRangesAtLine = (ranges: readonly DecoratedLineRange[], lineNumber: number) =>
  ranges
    .filter((range) => lineNumber >= range.startLine && lineNumber <= range.endLine)
    .sort((left, right) => {
      const lengthDifference = left.endLine - left.startLine - (right.endLine - right.startLine);

      return lengthDifference || left.startLine - right.startLine || left.endLine - right.endLine;
    });

const getNextRangeAtLine = (
  ranges: readonly DecoratedLineRange[],
  lineNumber: number,
  selectedRange: SelectedLineRange | null
): DecoratedLineRange | null => {
  const selectableRanges = getSelectableRangesAtLine(ranges, lineNumber);

  if (selectableRanges.length === 0) {
    return null;
  }

  const selectedIndex = selectableRanges.findIndex((range) => isSameRange(selectedRange, range));

  return selectableRanges[(selectedIndex + 1) % selectableRanges.length] ?? null;
};

const CodeViewer = memo(
  ({
    value,
    originalValue,
    language,
    filePath = 'solution',
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
    const selectedRangeRef = useRef<SelectedLineRange | null>(null);
    const { preference, monacoTheme, setPreference } = useCodeEditorTheme();

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
      const rangeMap = new Map<string, DecoratedLineRange>();

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

    useEffect(() => {
      if (!canComment && editorRef.current) {
        removeCommentWidget(editorRef.current);
      }
    }, [canComment, removeCommentWidget]);

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

    const injectRangeStyles = useCallback((ranges: DecoratedLineRange[], selected: SelectedLineRange | null) => {
      let styleEl = document.getElementById('code-viewer-range-styles');

      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'code-viewer-range-styles';
        document.head.appendChild(styleEl);
      }

      let css = '';
      let selectedCss = '';

      ranges.forEach((range, index) => {
        const isAI = range.isAI;
        let color = isAI ? AI_RANGE_COLOR : (RANGE_COLORS[index % RANGE_COLORS.length] ?? AI_RANGE_COLOR);

        if (isSameRange(selected, range)) {
          const colorIdx = index % RANGE_COLORS.length;

          color = isAI ? AI_RANGE_COLOR_SELECTED : (RANGE_COLORS_SELECTED[colorIdx] ?? AI_RANGE_COLOR_SELECTED);
          selectedCss = `.range-idx-${index} { background-color: ${color} !important; }\n`;
        } else {
          css += `.range-idx-${index} { background-color: ${color} !important; }\n`;
        }
      });

      styleEl.textContent = css + selectedCss;
    }, []);

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
          const range = getNextRangeAtLine(getUniqueRanges(), lineNum, selectedRangeRef.current);

          if (range && latestProps.current.onLineClick) {
            const newRange = {
              startLine: range.startLine,
              endLine: range.endLine,
            };

            selectedRangeRef.current = newRange;
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
          height: `${calculatedHeight + 52}px`,
        }}
      >
        <CodeToolbar filePath={filePath} themePreference={preference} onThemePreferenceChange={setPreference} />
        <div className={codeViewerStyles.editor}>
          {isDiff ? (
            <DiffEditor
              {...(language !== undefined ? { language } : {})}
              {...(originalValue !== undefined ? { original: originalValue } : {})}
              modified={value}
              theme={monacoTheme}
              options={editorOptions}
              onMount={handleEditorDidMount}
            />
          ) : (
            <Editor
              {...(language !== undefined ? { language } : {})}
              value={value}
              theme={monacoTheme}
              options={editorOptions}
              onMount={handleEditorDidMount}
            />
          )}
        </div>
      </div>
    );
  }
);

export default CodeViewer;
