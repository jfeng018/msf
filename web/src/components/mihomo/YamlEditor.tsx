"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { yaml } from "@codemirror/lang-yaml";
import { bracketMatching, defaultHighlightStyle, foldGutter, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";

function maxHeightValue(value: CSSProperties["maxHeight"]) {
  if (typeof value === "number") return `${value}px`;
  return value == null ? "460px" : String(value);
}

export function YamlEditor({
  value,
  onChange,
  maxHeight = 460,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  maxHeight?: CSSProperties["maxHeight"];
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const syncingRef = useRef(false);
  const height = maxHeightValue(maxHeight);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          foldGutter(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          dropCursor(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          highlightSelectionMatches(),
          yaml(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          oneDark,
          keymap.of([
            indentWithTab,
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            ...completionKeymap,
          ]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !syncingRef.current) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": {
              height: "100%",
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
            },
            ".cm-scroller": {
              maxHeight: height,
              overflow: "auto",
              fontFamily: 'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", monospace',
              fontSize: "13px",
              lineHeight: "20px",
            },
            ".cm-content": {
              minHeight: "180px",
              padding: "12px 16px 12px 0",
              caretColor: "#ffffff",
            },
            ".cm-line": {
              padding: "0 8px",
            },
            ".cm-gutters": {
              backgroundColor: "#1e1e1e",
              color: "#858585",
              borderRight: "1px solid rgba(255,255,255,0.08)",
            },
            ".cm-activeLineGutter": {
              backgroundColor: "rgba(255,255,255,0.06)",
            },
            ".cm-activeLine": {
              backgroundColor: "rgba(255,255,255,0.045)",
            },
            ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
              backgroundColor: "rgba(38, 121, 255, 0.45)",
            },
            "&.cm-focused": {
              outline: "none",
            },
            ".cm-search": {
              backgroundColor: "#252526",
              color: "#d4d4d4",
              borderTop: "1px solid rgba(255,255,255,0.12)",
            },
            ".cm-search input": {
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "6px",
            },
          }, { dark: true }),
        ],
      }),
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      if (viewRef.current === view) viewRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    syncingRef.current = true;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
    syncingRef.current = false;
  }, [value]);

  return (
    <div
      className={`overflow-hidden bg-[#1e1e1e] text-[#d4d4d4] ${className ?? ""}`}
      style={{ maxHeight }}
      ref={hostRef}
    />
  );
}
