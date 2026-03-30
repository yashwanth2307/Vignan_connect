'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Play, Terminal as TerminalIcon, X, ChevronDown,
  CheckCircle2, XCircle, Loader2,
  Copy, Download, RotateCcw, Maximize2, Minimize2,
  Flame, AlertCircle, Clock, Send, ChevronUp, Sun, Moon,
  Activity, HardDrive
} from 'lucide-react';

// ── Language configs ───────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: '.js', icon: '🟨', pistonId: 'javascript', version: '18.15.0', template: '// V-Connect Code Arena — JavaScript\n\nfunction solve(input) {\n  // Write your solution here\n  const lines = input.trim().split("\\n");\n  \n  return "Hello, V-Connect!";\n}\n\n// Read input\nconst input = require("fs").readFileSync("/dev/stdin", "utf8");\nconsole.log(solve(input));\n' },
  { id: 'python', label: 'Python', ext: '.py', icon: '🐍', pistonId: 'python', version: '3.10.0', template: '# V-Connect Code Arena — Python\n\ndef solve():\n    # Write your solution here\n    n = int(input())\n    print(f"Hello, V-Connect! n = {n}")\n\nsolve()\n' },
  { id: 'cpp', label: 'C++', ext: '.cpp', icon: '⚙️', pistonId: 'c++', version: '10.2.0', template: '// V-Connect Code Arena — C++\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    int n;\n    cin >> n;\n    \n    cout << "Hello, V-Connect! n = " << n << endl;\n    \n    return 0;\n}\n' },
  { id: 'java', label: 'Java', ext: '.java', icon: '☕', pistonId: 'java', version: '15.0.2', template: '// V-Connect Code Arena — Java\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        \n        System.out.println("Hello, V-Connect! n = " + n);\n    }\n}\n' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts', icon: '🔷', pistonId: 'typescript', version: '5.0.3', template: '// V-Connect Code Arena — TypeScript\n\nfunction solve(input: string): string {\n  const lines = input.trim().split("\\n");\n  const n = parseInt(lines[0]);\n  \n  return `Hello, V-Connect! n = ${n}`;\n}\n\nconsole.log(solve("5"));\n' },
  { id: 'c', label: 'C', ext: '.c', icon: '🔧', pistonId: 'c', version: '10.2.0', template: '// V-Connect Code Arena — C\n#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    \n    printf("Hello, V-Connect! n = %d\\n", n);\n    \n    return 0;\n}\n' },
  { id: 'rust', label: 'Rust', ext: '.rs', icon: '🦀', pistonId: 'rust', version: '1.68.2', template: '// V-Connect Code Arena — Rust\nuse std::io;\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    let n: i32 = input.trim().parse().unwrap();\n    \n    println!("Hello, V-Connect! n = {}", n);\n}\n' },
  { id: 'go', label: 'Go', ext: '.go', icon: '🐹', pistonId: 'go', version: '1.16.2', template: '// V-Connect Code Arena — Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    var n int\n    fmt.Scan(&n)\n    \n    fmt.Printf("Hello, V-Connect! n = %d\\n", n)\n}\n' },
];

// ── Complexity analysis heuristics ─────────────────────────────────────
function analyzeComplexity(code: string, languageId: string): { time: string; space: string; note: string } {
  const c = code;

  // Count nested loops
  const forLoops = (c.match(/\bfor\b/g) || []).length;
  const whileLoops = (c.match(/\bwhile\b/g) || []).length;
  const totalLoops = forLoops + whileLoops;

  // Check for recursive patterns (string-based detection)
  const hasRecursion =
    c.includes('return solve(') || c.includes('return dfs(') ||
    c.includes('return bfs(') || c.includes('return helper(') ||
    c.includes('return dp(') || c.includes('return rec(') ||
    c.includes('return fib(') || c.includes('return factorial(') ||
    // Python recursion: def funcname ... funcname(
    /def\s+(\w+)\s*\([^)]*\)[\s\S]{0,500}\1\s*\(/.test(c);

  // DP / memoization
  const hasDp = /dp\s*[\[=]|memo\s*[\[=]|cache\s*[\[=]|\[\s*\]\s*=/.test(c);

  // Sort usage
  const hasSort = /\.sort\(|sort\(|Arrays\.sort|Collections\.sort|std::sort/.test(c);

  // BFS/DFS patterns
  const hasBfsDfs = /queue|Queue|deque|Deque|BFS|DFS|bfs|dfs/.test(c);

  // Hash map / set
  const hasHash = /HashMap|HashSet|unordered_map|unordered_set|dict\b|\{\}|Map\b|Set\b/.test(c);

  // Binary search
  const hasBinarySearch = /binary_search|bisect|binarySearch|lo.*mid.*hi|left.*mid.*right/.test(c);

  // Determine Time Complexity
  let time = 'O(n)';
  let space = 'O(1)';
  let note = '';

  if (hasBinarySearch) {
    time = 'O(log n)';
    note = 'Binary search pattern detected';
  } else if (totalLoops === 0 && !hasRecursion) {
    time = 'O(1)';
    space = 'O(1)';
    note = 'No loops or recursion detected';
  } else if (hasDp && hasRecursion) {
    time = 'O(n²)';
    space = 'O(n)';
    note = 'Dynamic programming with memoization detected';
  } else if (hasDp) {
    time = 'O(n²)';
    space = 'O(n)';
    note = 'DP table pattern detected';
  } else if (totalLoops >= 3) {
    time = 'O(n³)';
    space = 'O(1)';
    note = 'Triple-nested loop pattern detected';
  } else if (totalLoops === 2 || (hasSort && totalLoops >= 1)) {
    time = 'O(n²)';
    space = 'O(1)';
    note = hasSort ? 'Sort + loop pattern detected' : 'Nested loops detected';
  } else if (hasSort) {
    time = 'O(n log n)';
    space = 'O(log n)';
    note = 'Sorting dominates complexity';
  } else if (hasRecursion) {
    time = 'O(2ⁿ)';
    space = 'O(n)';
    note = 'Recursive pattern detected (may be exponential)';
  } else if (totalLoops === 1) {
    time = 'O(n)';
    space = 'O(1)';
    note = 'Single loop detected';
  }

  // Space overrides
  if (hasHash && space === 'O(1)') space = 'O(n)';
  if (hasBfsDfs && space === 'O(1)') space = 'O(n)';
  if (hasDp) space = 'O(n²)' ;

  return { time, space, note };
}

interface VSCodeIDEProps {
  problem?: any;
  onSubmitCode?: (language: string, code: string) => Promise<void>;
  submitResult?: any;
  isStudent?: boolean;
  submitting?: boolean;
}

export default function VSCodeIDE({ problem, onSubmitCode, submitResult, isStudent, submitting }: VSCodeIDEProps) {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [input, setInput] = useState('5\n');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runTime, setRunTime] = useState<number | null>(null);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [panelHeight, setPanelHeight] = useState(220);
  const [complexity, setComplexity] = useState<{ time: string; space: string; note: string } | null>(null);
  const [hasError, setHasError] = useState(false);

  const editorRef = useRef<any>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [terminalLines, setTerminalLines] = useState<{ text: string; type: 'info' | 'output' | 'error' | 'success' | 'cmd' | 'system' }[]>([
    { text: '▶  V-Connect Code Arena Terminal  v2.0', type: 'system' },
    { text: '   Powered by Piston API — supports 8 languages.', type: 'info' },
    { text: '   Press ▶ Run or Ctrl+Enter to execute your code.', type: 'info' },
    { text: '', type: 'info' },
  ]);

  // Scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Handle language change
  const handleLanguageChange = (langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
    setLanguage(lang);
    setCode(lang.template);
    setOutput('');
    setRunTime(null);
    setComplexity(null);
  };

  // Monaco editor mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleRunCode(),
    });

    monaco.editor.defineTheme('arena-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editorCursor.foreground': '#58a6ff',
        'editor.lineHighlightBackground': '#161b22',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#e6edf3',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#264f7844',
        'editorIndentGuide.background1': '#21262d',
        'editorIndentGuide.activeBackground1': '#30363d',
      },
    });

    monaco.editor.defineTheme('arena-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292f',
      },
    });

    editor.updateOptions({ theme: 'arena-dark' });
  };

  // Run code via Piston API
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('');
    setRunTime(null);
    setComplexity(null);
    setHasError(false);

    const timeStr = new Date().toLocaleTimeString();
    setTerminalLines(prev => [
      ...prev,
      { text: `[${timeStr}] ⚡ Running ${language.label}...`, type: 'cmd' },
    ]);

    const startTime = Date.now();

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language.pistonId,
          version: language.version,
          files: [{ name: `solution${language.ext}`, content: code }],
          stdin: input,
          run_timeout: 10000,
        }),
      });

      const data = await response.json();
      const elapsed = Date.now() - startTime;
      setRunTime(elapsed);

      // ── Compilation error (C++, Java, Rust, Go, C)
      if (data.compile?.stderr) {
        setHasError(true);
        const errLines = data.compile.stderr.split('\n').filter(Boolean);
        setOutput('Compilation Error:\n' + data.compile.stderr);
        setTerminalLines(prev => [
          ...prev,
          { text: '━━━ COMPILATION ERROR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'error' },
          ...errLines.map((l: string) => ({ text: l, type: 'error' as const })),
          { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'error' },
          { text: `[${new Date().toLocaleTimeString()}] ✗ Compilation failed in ${elapsed}ms`, type: 'error' },
          { text: '', type: 'info' },
        ]);
        setIsRunning(false);
        return;
      }

      if (data.run) {
        const out = data.run.stdout || '';
        const err = data.run.stderr || '';
        const exitCode = data.run.code ?? 0;
        setOutput(out + (err ? '\n' + err : ''));

        const outLines = out.trim().split('\n').filter(Boolean);
        const errLines = err.trim().split('\n').filter(Boolean);

        if (errLines.length > 0) {
          setHasError(true);
          setTerminalLines(prev => [
            ...prev,
            ...(outLines.length > 0 ? outLines.map((l: string) => ({ text: '  ' + l, type: 'output' as const })) : []),
            { text: '━━━ RUNTIME ERROR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'error' },
            ...errLines.map((l: string) => ({ text: l, type: 'error' as const })),
            { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'error' },
            { text: `[${new Date().toLocaleTimeString()}] ✗ Runtime error in ${elapsed}ms  (exit: ${exitCode})`, type: 'error' },
            { text: '', type: 'info' },
          ]);
        } else {
          setTerminalLines(prev => [
            ...prev,
            ...(outLines.length > 0
              ? outLines.map((l: string) => ({ text: '  ' + l, type: 'output' as const }))
              : [{ text: '  (no output)', type: 'info' as const }]),
            { text: `[${new Date().toLocaleTimeString()}] ✓ Finished in ${elapsed}ms  (exit: ${exitCode})`, type: 'success' },
            { text: '', type: 'info' },
          ]);
        }
      } else {
        setHasError(true);
        setTerminalLines(prev => [
          ...prev,
          { text: '  ✗ Unknown execution error', type: 'error' },
          { text: '', type: 'info' },
        ]);
      }
    } catch (err: any) {
      setHasError(true);
      setTerminalLines(prev => [
        ...prev,
        { text: `  ✗ Network error: ${err.message}`, type: 'error' },
        { text: '', type: 'info' },
      ]);
    }

    setIsRunning(false);
  }, [code, input, language, isRunning]);

  // Submit code — run complexity analysis then submit
  const handleSubmit = async () => {
    if (!onSubmitCode || !code.trim() || submitting) return;
    const comp = analyzeComplexity(code, language.id);
    setComplexity(comp);
    const timeStr = new Date().toLocaleTimeString();
    setTerminalLines(prev => [
      ...prev,
      { text: `[${timeStr}] 📤 Submitting solution for judging...`, type: 'cmd' },
    ]);
    await onSubmitCode(language.id, code);
  };

  const handleCopy = () => navigator.clipboard.writeText(code);
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution${language.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleReset = () => {
    setCode(language.template);
    setOutput('');
    setRunTime(null);
    setComplexity(null);
  };

  const isDark = editorTheme === 'vs-dark';
  const bg = isDark ? '#0d1117' : '#ffffff';
  const fg = isDark ? '#e6edf3' : '#24292f';
  const border = isDark ? '#21262d' : '#d0d7de';
  const panelBg = isDark ? '#010409' : '#f6f8fa';
  const headerBg = isDark ? '#161b22' : '#f6f8fa';

  const terminalColor = (type: string) => {
    switch (type) {
      case 'cmd': return '#58a6ff';
      case 'output': return '#e6edf3';
      case 'error': return '#f85149';
      case 'success': return '#3fb950';
      case 'system': return '#a5d6ff';
      case 'info': return '#8b949e';
      default: return fg;
    }
  };

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden border shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      style={{
        borderColor: border,
        height: isFullscreen ? '100vh' : 'calc(100vh - 180px)',
        minHeight: '520px',
        background: bg,
      }}
    >
      {/* ═══ TOP TOOLBAR ═══ */}
      <div
        className="flex items-center justify-between px-3 h-10 shrink-0 gap-3"
        style={{ background: headerBg, borderBottom: `1px solid ${border}` }}
      >
        {/* Left: traffic lights + file info */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f85149]/80" />
            <div className="w-3 h-3 rounded-full bg-[#d29922]/80" />
            <div className="w-3 h-3 rounded-full bg-[#3fb950]/80" />
          </div>
          <div className="flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} />
            <span className="text-[12px] font-medium" style={{ color: fg }}>
              solution{language.ext}
            </span>
            {problem && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-1 ${
                problem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400'
                : problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
              }`}>
                {problem.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Center: language selector */}
        <select
          value={language.id}
          onChange={e => handleLanguageChange(e.target.value)}
          className="text-[12px] rounded-lg px-3 py-1 outline-none border font-medium cursor-pointer"
          style={{ background: isDark ? '#21262d' : '#ffffff', color: fg, borderColor: border }}
        >
          {LANGUAGES.map(l => (
            <option key={l.id} value={l.id}>{l.icon} {l.label}</option>
          ))}
        </select>

        {/* Right: tools + run + submit */}
        <div className="flex items-center gap-1">
          <button onClick={() => setEditorTheme(isDark ? 'light' : 'vs-dark')} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" title="Toggle Theme">
            {isDark ? <Sun className="w-3.5 h-3.5" style={{ color: '#8b949e' }} /> : <Moon className="w-3.5 h-3.5" style={{ color: '#8b949e' }} />}
          </button>
          <button onClick={handleCopy} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#8b949e' }} title="Copy Code">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDownload} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#8b949e' }} title="Download">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#8b949e' }} title="Reset">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#8b949e' }} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Font size */}
          <div className="flex items-center gap-1 mx-1">
            <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="w-5 h-5 text-[11px] rounded flex items-center justify-center hover:bg-white/10" style={{ color: '#8b949e' }}>−</button>
            <span className="text-[11px] w-6 text-center" style={{ color: '#8b949e' }}>{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="w-5 h-5 text-[11px] rounded flex items-center justify-center hover:bg-white/10" style={{ color: '#8b949e' }}>+</button>
          </div>

          {/* Input toggle */}
          <button
            onClick={() => setShowInput(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
            style={{ background: showInput ? '#58a6ff22' : 'transparent', color: showInput ? '#58a6ff' : '#8b949e', border: `1px solid ${showInput ? '#58a6ff44' : 'transparent'}` }}
            title="Toggle STDIN Input"
          >
            <TerminalIcon className="w-3 h-3" /> STDIN
          </button>

          {/* Run button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-semibold transition-all ml-1"
            style={{ background: isRunning ? '#21262d' : '#238636', color: isRunning ? '#8b949e' : '#ffffff', border: `1px solid ${isRunning ? '#30363d' : '#2ea043'}` }}
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isRunning ? 'Running...' : 'Run'}
          </button>

          {/* Submit button */}
          {isStudent && problem && onSubmitCode && (
            <button
              onClick={handleSubmit}
              disabled={submitting || !code.trim()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-semibold transition-all"
              style={{ background: submitting ? '#21262d' : '#1f6feb', color: submitting ? '#8b949e' : '#ffffff', border: `1px solid ${submitting ? '#30363d' : '#388bfd'}` }}
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
              Submit
            </button>
          )}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* STDIN input panel (collapsible) */}
        {showInput && (
          <div className="shrink-0 flex flex-col" style={{ maxHeight: '120px', borderBottom: `1px solid ${border}`, background: isDark ? '#161b22' : '#f6f8fa' }}>
            <div className="flex items-center justify-between px-3 py-1" style={{ borderBottom: `1px solid ${border}` }}>
              <span className="text-[11px] font-semibold tracking-wider" style={{ color: '#58a6ff' }}>STDIN</span>
              <button onClick={() => setShowInput(false)} style={{ color: '#8b949e' }}><X className="w-3 h-3" /></button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter program input here..."
              className="flex-1 w-full bg-transparent outline-none resize-none text-[13px] p-2 font-mono"
              style={{ color: fg }}
              spellCheck={false}
            />
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language.id === 'cpp' ? 'cpp' : language.id === 'c' ? 'c' : language.id}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorMount}
            theme={isDark ? 'arena-dark' : 'arena-light'}
            options={{
              fontSize,
              fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              wordWrap: 'off',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              suggest: { showKeywords: true, showSnippets: true },
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              links: true,
              contextmenu: true,
              quickSuggestions: true,
              parameterHints: { enabled: true },
              tabSize: language.id === 'python' ? 4 : 2,
            }}
          />
        </div>

        {/* ─── Terminal ─── */}
        <div
          className="shrink-0 flex flex-col"
          style={{ height: `${panelHeight}px`, background: panelBg, borderTop: `1px solid ${border}` }}
        >
          {/* Terminal header */}
          <div
            className="flex items-center justify-between px-3 h-8 shrink-0"
            style={{ background: isDark ? '#161b22' : '#f0f3f6', borderBottom: `1px solid ${border}` }}
          >
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} />
              <span className="text-[11px] font-semibold tracking-wider" style={{ color: '#58a6ff' }}>TERMINAL</span>
              {runTime !== null && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#3fb95020', color: '#3fb950' }}>
                  <Clock className="w-2.5 h-2.5" /> {runTime}ms
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPanelHeight(h => Math.min(h + 60, 420))}
                className="p-0.5 rounded hover:bg-white/10"
                style={{ color: '#8b949e' }}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPanelHeight(h => Math.max(h - 60, 100))}
                className="p-0.5 rounded hover:bg-white/10"
                style={{ color: '#8b949e' }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTerminalLines([
                  { text: '▶  Terminal cleared.', type: 'system' },
                  { text: '', type: 'info' },
                ])}
                className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10 ml-1"
                style={{ color: '#8b949e' }}
              >
                clear
              </button>
            </div>
          </div>

          {/* Terminal output */}
          <div className="flex-1 overflow-auto p-3 font-mono text-[12px]">
            {terminalLines.map((line, i) => (
              <div key={i} className="leading-5 whitespace-pre-wrap" style={{ color: terminalColor(line.type) }}>
                {line.text || '\u00A0'}
              </div>
            ))}
            <div className="flex items-center gap-1 mt-1">
              <span style={{ color: '#3fb950' }}>❯</span>
              <span className="animate-pulse" style={{ color: '#58a6ff' }}>▊</span>
            </div>
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* ═══ SUBMISSION RESULT + COMPLEXITY + TEST CASES ═══ */}
      {submitResult && (
        <div
          className="shrink-0 mx-3 mb-3 rounded-xl overflow-hidden"
          style={{ border: `1px solid ${submitResult.status === 'ACCEPTED' ? '#2ea043' : '#f85149'}`, maxHeight: '320px', overflowY: 'auto' }}
        >
          {/* Status row */}
          <div
            className="flex items-center justify-between px-4 py-2.5 sticky top-0 z-10"
            style={{ background: submitResult.status === 'ACCEPTED' ? '#238636' : submitResult.status === 'COMPILE_ERROR' ? '#6e1616' : '#b62324' }}
          >
            <div className="flex items-center gap-2">
              {submitResult.status === 'ACCEPTED'
                ? <CheckCircle2 className="w-4 h-4 text-white" />
                : <XCircle className="w-4 h-4 text-white" />}
              <span className="font-bold text-[13px] text-white">
                {submitResult.status === 'ACCEPTED' ? '✅ Accepted' :
                 submitResult.status === 'COMPILE_ERROR' ? '🔴 Compilation Error' :
                 `❌ ${submitResult.status}`}
              </span>
              <span className="text-[11px] text-white/70">
                {submitResult.totalTests > 0 ? `Tests: ${submitResult.testsPassed}/${submitResult.totalTests} passed` : 'No test cases'}
              </span>
            </div>
            {submitResult.vPointsEarned > 0 && (
              <span className="flex items-center gap-1 text-[12px] font-bold text-white">
                <Flame className="w-4 h-4" /> +{submitResult.vPointsEarned} V-Points
              </span>
            )}
          </div>

          {/* Compilation Error Detail */}
          {submitResult.compilationError && (
            <div className="px-4 py-3" style={{ background: isDark ? '#160d0d' : '#fff0f0' }}>
              <p className="text-[11px] font-semibold mb-1" style={{ color: '#f85149' }}>🔴 Compilation Error</p>
              <pre className="text-[11px] whitespace-pre-wrap font-mono" style={{ color: '#f85149' }}>{submitResult.compilationError}</pre>
            </div>
          )}

          {/* Per-test-case breakdown */}
          {submitResult.testResults && submitResult.testResults.length > 0 && (
            <div style={{ background: isDark ? '#0d1117' : '#ffffff' }}>
              {submitResult.testResults.map((tc: any, i: number) => (
                <div
                  key={i}
                  className="px-4 py-2.5 border-t"
                  style={{ borderColor: border }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {tc.passed
                      ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#3fb950' }} />
                      : <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f85149' }} />}
                    <span className="text-[11px] font-semibold" style={{ color: tc.passed ? '#3fb950' : '#f85149' }}>
                      Test Case {tc.index} — {tc.passed ? 'Passed' : 'Failed'}
                    </span>
                    <span className="text-[10px] ml-auto" style={{ color: '#8b949e' }}>{tc.executionTime}ms</span>
                  </div>
                  {!tc.passed && (
                    <div className="grid grid-cols-2 gap-2 ml-5">
                      {tc.input && (
                        <div>
                          <p className="text-[9px] font-semibold tracking-wider mb-0.5" style={{ color: '#8b949e' }}>INPUT</p>
                          <pre className="text-[11px] font-mono p-1.5 rounded" style={{ background: isDark ? '#161b22' : '#f6f8fa', color: fg }}>{tc.input}</pre>
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] font-semibold tracking-wider mb-0.5" style={{ color: '#8b949e' }}>EXPECTED</p>
                        <pre className="text-[11px] font-mono p-1.5 rounded" style={{ background: isDark ? '#1a2e1a' : '#f0fff0', color: '#3fb950' }}>{tc.expected || '(empty)'}</pre>
                      </div>
                      {tc.actual !== undefined && !tc.error && (
                        <div className={tc.input ? '' : 'col-span-1'}>
                          <p className="text-[9px] font-semibold tracking-wider mb-0.5" style={{ color: '#8b949e' }}>YOUR OUTPUT</p>
                          <pre className="text-[11px] font-mono p-1.5 rounded" style={{ background: isDark ? '#2e1a1a' : '#fff0f0', color: '#f85149' }}>{tc.actual || '(empty)'}</pre>
                        </div>
                      )}
                      {tc.error && (
                        <div className="col-span-2">
                          <p className="text-[9px] font-semibold tracking-wider mb-0.5" style={{ color: '#f85149' }}>ERROR</p>
                          <pre className="text-[11px] font-mono p-1.5 rounded whitespace-pre-wrap" style={{ background: isDark ? '#160d0d' : '#fff0f0', color: '#f85149' }}>{tc.error}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Complexity row */}
          {complexity && (
            <div
              className="flex items-stretch border-t"
              style={{ background: isDark ? '#161b22' : '#f6f8fa', borderColor: border }}
            >
              <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-4 gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3" style={{ color: '#58a6ff' }} />
                  <span className="text-[9px] font-semibold tracking-wider" style={{ color: '#8b949e' }}>TIME</span>
                </div>
                <span className="text-[16px] font-bold" style={{ color: '#58a6ff', fontFamily: 'monospace' }}>{complexity.time}</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-4 gap-0.5 border-l" style={{ borderColor: border }}>
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3 h-3" style={{ color: '#bc8cff' }} />
                  <span className="text-[9px] font-semibold tracking-wider" style={{ color: '#8b949e' }}>SPACE</span>
                </div>
                <span className="text-[16px] font-bold" style={{ color: '#bc8cff', fontFamily: 'monospace' }}>{complexity.space}</span>
              </div>
              {complexity.note && (
                <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-4 gap-0.5 border-l" style={{ borderColor: border }}>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" style={{ color: '#d29922' }} />
                    <span className="text-[9px] font-semibold tracking-wider" style={{ color: '#8b949e' }}>ANALYSIS</span>
                  </div>
                  <span className="text-[10px] text-center" style={{ color: '#d29922' }}>{complexity.note}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ STATUS BAR ═══ */}
      <div
        className="flex items-center justify-between px-3 h-6 shrink-0 select-none transition-colors"
        style={{ background: hasError ? '#b62324' : isDark ? '#238636' : '#0969da', color: '#ffffff' }}
      >
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <TerminalIcon className="w-2.5 h-2.5" /> V-Connect Code Arena
          </span>
          <span>{language.label}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          {runTime !== null && (
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> {runTime}ms
            </span>
          )}
          <span>UTF-8</span>
          <span>Ln {code.split('\n').length}</span>
          <span className="flex items-center gap-1">
            {isRunning ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
            {isRunning ? 'Executing...' : 'Piston API Ready'}
          </span>
        </div>
      </div>
    </div>
  );
}
