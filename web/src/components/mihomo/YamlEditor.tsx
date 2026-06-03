"use client";

import { useMemo, type CSSProperties } from "react";

/* VS Code Dark+ token palette (matches the original CodeMirror theme) */
const COLORS = {
  comment: "#6A9955",
  key: "#9CDCFE",
  anchor: "#4FC1FF",
  string: "#CE9178",
  number: "#B5CEA8",
  keyword: "#569CD6",
  punct: "#D4D4D4",
  text: "#D4D4D4",
};

type Tok = { t: string; c: keyof typeof COLORS };

/* Lightweight YAML tokenizer — good enough to mirror VS Code Dark+ colors */
function tokenizeLine(line: string): Tok[] {
  if (line.trimStart().startsWith("#")) return [{ t: line, c: "comment" }];

  const toks: Tok[] = [];
  const re =
    /('[^']*'|"[^"]*")|(\s#.*$)|(&[\w.-]+|\*[\w.-]+)|\b(true|false|null|yes|no)\b|(-?\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w.-]*)(?=\s*:)|([:{}\[\],|>-])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) toks.push({ t: line.slice(last, m.index), c: "text" });
    if (m[1]) toks.push({ t: m[1], c: "string" });
    else if (m[2]) toks.push({ t: m[2], c: "comment" });
    else if (m[3]) toks.push({ t: m[3], c: "anchor" });
    else if (m[4]) toks.push({ t: m[4], c: "keyword" });
    else if (m[5]) toks.push({ t: m[5], c: "number" });
    else if (m[6]) toks.push({ t: m[6], c: "key" });
    else if (m[7]) toks.push({ t: m[7], c: "punct" });
    last = re.lastIndex;
  }
  if (last < line.length) toks.push({ t: line.slice(last), c: "text" });
  return toks;
}

const FONT: CSSProperties = {
  fontFamily: 'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", monospace',
  fontSize: "13px",
  lineHeight: "20px",
  tabSize: 2,
};

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
  const lines = useMemo(() => value.split("\n"), [value]);

  return (
    <div
      className={`relative flex overflow-auto bg-[#1e1e1e] text-[#d4d4d4] ${className ?? ""}`}
      style={{ maxHeight }}
    >
      {/* Gutter */}
      <div
        className="select-none text-right py-3 pl-3 pr-3 text-[#858585] shrink-0 sticky left-0 bg-[#1e1e1e] z-10"
        style={FONT}
        aria-hidden
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Code area: highlighted <pre> behind a transparent <textarea> */}
      <div className="relative flex-1" style={{ minWidth: "max-content" }}>
        <pre
          className="m-0 py-3 pr-6 pointer-events-none whitespace-pre"
          style={FONT}
          aria-hidden
        >
          {lines.map((line, i) => (
            <div key={i} style={{ minHeight: 20 }}>
              {tokenizeLine(line).map((tok, j) => (
                <span key={j} style={{ color: COLORS[tok.c] }}>
                  {tok.t}
                </span>
              ))}
              {line.length === 0 && "​"}
            </div>
          ))}
        </pre>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          wrap="off"
          className="absolute inset-0 m-0 py-3 pr-6 bg-transparent text-transparent caret-white outline-none resize-none whitespace-pre overflow-hidden"
          style={FONT}
        />
      </div>
    </div>
  );
}
