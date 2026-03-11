'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Play, Square, Terminal as TerminalIcon, X, ChevronDown, ChevronRight,
  FileCode2, FolderOpen, Search, GitBranch, Puzzle, Settings,
  User, Bell, Wifi, WifiOff, CheckCircle2, XCircle, Loader2,
  Copy, Download, Upload, RotateCcw, Maximize2, Minimize2, Sun, Moon,
  FileJson, FileText, Braces, Hash, Code2, Bug, PanelBottomClose,
  PanelBottom, LayoutGrid, Flame, BookOpen, AlertCircle, Info,
  ChevronUp, Minus, Split, MoreHorizontal, Clock
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

// ── Extension definitions ──────────────────────────────────────────────
const EXTENSIONS = [
  { id: 'prettier', name: 'Prettier', desc: 'Code formatter', author: 'V-Connect', icon: '🎨', installed: true, category: 'Formatters' },
  { id: 'bracket', name: 'Bracket Pair Colorizer', desc: 'Colorize matching brackets', author: 'V-Connect', icon: '🌈', installed: true, category: 'Visual' },
  { id: 'autoclose', name: 'Auto Close Tag', desc: 'Auto close HTML/XML tags', author: 'V-Connect', icon: '🏷️', installed: true, category: 'Languages' },
  { id: 'snippets', name: 'Code Snippets', desc: 'Useful code snippets for all languages', author: 'V-Connect', icon: '✂️', installed: true, category: 'Snippets' },
  { id: 'gitlens', name: 'GitLens', desc: 'Git supercharged', author: 'V-Connect', icon: '🔍', installed: false, category: 'SCM' },
  { id: 'liveserver', name: 'Live Server', desc: 'Launch development server', author: 'V-Connect', icon: '🚀', installed: false, category: 'Tools' },
  { id: 'errorlens', name: 'Error Lens', desc: 'Inline error highlighting', author: 'V-Connect', icon: '🔴', installed: true, category: 'Visual' },
  { id: 'copilot', name: 'V-Connect AI Copilot', desc: 'AI-powered code suggestions', author: 'V-Connect', icon: '🤖', installed: false, category: 'AI' },
  { id: 'material-icon', name: 'Material Icon Theme', desc: 'Material Design icons for files', author: 'V-Connect', icon: '📁', installed: true, category: 'Themes' },
  { id: 'indent-rainbow', name: 'Indent Rainbow', desc: 'Colorize indentation', author: 'V-Connect', icon: '🌈', installed: false, category: 'Visual' },
  { id: 'path-intellisense', name: 'Path Intellisense', desc: 'Autocomplete file paths', author: 'V-Connect', icon: '📂', installed: false, category: 'Languages' },
  { id: 'markdown-preview', name: 'Markdown Preview', desc: 'Preview Markdown files', author: 'V-Connect', icon: '📝', installed: true, category: 'Languages' },
];

// ── File tree entries ──────────────────────────────────────────────────
interface FileEntry {
  name: string;
  type: 'file' | 'folder';
  lang?: string;
  children?: FileEntry[];
  content?: string;
}

interface VSCodeIDEProps {
  problem?: any;
  onSubmitCode?: (language: string, code: string) => Promise<void>;
  submitResult?: any;
  isStudent?: boolean;
  submitting?: boolean;
}

type PanelType = 'terminal' | 'output' | 'problems' | 'debug';
type SidebarView = 'explorer' | 'search' | 'git' | 'extensions' | 'settings';

export default function VSCodeIDE({ problem, onSubmitCode, submitResult, isStudent, submitting }: VSCodeIDEProps) {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [input, setInput] = useState('5\n');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runTime, setRunTime] = useState<number | null>(null);
  const [runMemory, setRunMemory] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelType>('terminal');
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer');
  const [showSidebar, setShowSidebar] = useState(true);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openFiles, setOpenFiles] = useState<{ name: string; lang: string; content: string }[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedExtensions, setInstalledExtensions] = useState<Set<string>>(
    new Set(EXTENSIONS.filter(e => e.installed).map(e => e.id))
  );
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '\x1b[32m❯\x1b[0m V-Connect Code Arena Terminal v2.0',
    '\x1b[90m  Type your code, hit Run (▶) or Ctrl+Enter to execute.\x1b[0m',
    '\x1b[90m  Powered by Piston API — supports 50+ languages.\x1b[0m',
    '',
  ]);
  const [problemsList, setProblemsList] = useState<{ msg: string; severity: 'error' | 'warning' | 'info' }[]>([]);
  const [wordWrap, setWordWrap] = useState(false);
  const [minimap, setMinimap] = useState(true);
  const [panelHeight, setPanelHeight] = useState(220);

  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Initialize with problem or default file
  useEffect(() => {
    const fileName = `solution${language.ext}`;
    const initialFile = { name: fileName, lang: language.id, content: code };
    setOpenFiles([initialFile]);
    setActiveFileIndex(0);
  }, []);

  // Update code when language changes
  const handleLanguageChange = (langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
    setLanguage(lang);
    const newCode = lang.template;
    setCode(newCode);
    const fileName = `solution${lang.ext}`;
    const newFile = { name: fileName, lang: lang.id, content: newCode };
    const existingIndex = openFiles.findIndex(f => f.lang === lang.id);
    if (existingIndex >= 0) {
      const updated = [...openFiles];
      updated[existingIndex] = newFile;
      setOpenFiles(updated);
      setActiveFileIndex(existingIndex);
    } else {
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFileIndex(openFiles.length);
    }
  };

  // Monaco editor mount handler
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add keyboard shortcuts
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleRunCode(),
    });

    editor.addAction({
      id: 'format-code',
      label: 'Format Document',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: () => {
        editor.getAction('editor.action.formatDocument')?.run();
      },
    });

    // Custom theme
    monaco.editor.defineTheme('vconnect-dark', {
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
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editorCursor.foreground': '#f5e0dc',
        'editor.lineHighlightBackground': '#313244',
        'editorLineNumber.foreground': '#6c7086',
        'editorLineNumber.activeForeground': '#cdd6f4',
        'editor.selectionBackground': '#45475a',
        'editor.inactiveSelectionBackground': '#31324466',
        'editorIndentGuide.background1': '#31324480',
        'editorIndentGuide.activeBackground1': '#45475a',
        'editorBracketMatch.background': '#45475a44',
        'editorBracketMatch.border': '#89b4fa',
      },
    });

    monaco.editor.defineTheme('vconnect-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1e1e2e',
      },
    });

    editor.updateOptions({ theme: 'vconnect-dark' });
  };

  // ── Run code via Piston API ─────────────────────────────────────────
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('');
    setRunTime(null);
    setRunMemory(null);
    setActivePanel('output');
    setShowPanel(true);
    setProblemsList([]);

    const startTime = Date.now();

    setTerminalHistory(prev => [
      ...prev,
      `\x1b[36m[${new Date().toLocaleTimeString()}]\x1b[0m \x1b[33m⚡ Running ${language.label}...\x1b[0m`,
    ]);

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

      if (data.run) {
        const out = data.run.stdout || '';
        const err = data.run.stderr || '';
        const combined = out + (err ? `\n\x1b[31m${err}\x1b[0m` : '');
        setOutput(combined || '(No output)');

        if (err) {
          const errorLines = err.split('\n').filter(Boolean);
          setProblemsList(errorLines.map((line: string) => ({ msg: line, severity: 'error' as const })));
        }

        setTerminalHistory(prev => [
          ...prev,
          ...(out ? out.split('\n').map((l: string) => `  ${l}`) : ['  (No output)']),
          ...(err ? err.split('\n').map((l: string) => `  \x1b[31m${l}\x1b[0m`) : []),
          `\x1b[36m[${new Date().toLocaleTimeString()}]\x1b[0m \x1b[32m✓ Done in ${elapsed}ms\x1b[0m (exit code: ${data.run.code})`,
          '',
        ]);
      } else if (data.compile && data.compile.stderr) {
        setOutput(`Compilation Error:\n${data.compile.stderr}`);
        setProblemsList([{ msg: data.compile.stderr, severity: 'error' }]);
        setTerminalHistory(prev => [
          ...prev,
          `  \x1b[31m✗ Compilation Error\x1b[0m`,
          ...data.compile.stderr.split('\n').map((l: string) => `  \x1b[31m${l}\x1b[0m`),
          '',
        ]);
      } else {
        setOutput('Unknown error occurred');
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}\n\nCheck your internet connection.`);
      setTerminalHistory(prev => [
        ...prev,
        `  \x1b[31m✗ ${err.message}\x1b[0m`,
        '',
      ]);
    }

    setIsRunning(false);
  }, [code, input, language, isRunning]);

  // File tree for explorer
  const fileTree: FileEntry[] = [
    {
      name: 'v-connect-arena', type: 'folder', children: [
        {
          name: 'src', type: 'folder', children: [
            { name: `solution${language.ext}`, type: 'file', lang: language.id },
            { name: 'input.txt', type: 'file', lang: 'plaintext' },
          ]
        },
        { name: 'README.md', type: 'file', lang: 'markdown' },
        { name: 'package.json', type: 'file', lang: 'json' },
      ]
    },
  ];

  const getFileIcon = (name: string) => {
    if (name.endsWith('.js') || name.endsWith('.ts')) return <FileCode2 className="w-4 h-4 text-yellow-400" />;
    if (name.endsWith('.py')) return <FileCode2 className="w-4 h-4 text-blue-400" />;
    if (name.endsWith('.cpp') || name.endsWith('.c')) return <FileCode2 className="w-4 h-4 text-blue-500" />;
    if (name.endsWith('.java')) return <FileCode2 className="w-4 h-4 text-orange-400" />;
    if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-yellow-300" />;
    if (name.endsWith('.md')) return <FileText className="w-4 h-4 text-blue-300" />;
    if (name.endsWith('.rs')) return <FileCode2 className="w-4 h-4 text-orange-500" />;
    if (name.endsWith('.go')) return <FileCode2 className="w-4 h-4 text-cyan-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  // Download code
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution${language.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset code
  const handleReset = () => {
    setCode(language.template);
    setOutput('');
    setRunTime(null);
    setProblemsList([]);
  };

  // File tree component
  const FileTreeNode = ({ entry, depth = 0 }: { entry: FileEntry; depth?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const isFolder = entry.type === 'folder';

    return (
      <div>
        <div
          className={`flex items-center gap-1.5 py-[3px] px-2 cursor-pointer hover:bg-[#2a2d3e] text-[13px] group transition-colors ${!isFolder && entry.name === `solution${language.ext}` ? 'bg-[#37394e] text-white' : 'text-[#cdd6f4]/80'
            }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => isFolder ? setExpanded(!expanded) : null}
        >
          {isFolder ? (
            expanded ? <ChevronDown className="w-3.5 h-3.5 text-[#6c7086] shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-[#6c7086] shrink-0" />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          {isFolder ? (
            <FolderOpen className={`w-4 h-4 shrink-0 ${expanded ? 'text-[#89b4fa]' : 'text-[#6c7086]'}`} />
          ) : (
            getFileIcon(entry.name)
          )}
          <span className="truncate">{entry.name}</span>
        </div>
        {isFolder && expanded && entry.children?.map((child, i) => (
          <FileTreeNode key={child.name + i} entry={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────
  const isDark = editorTheme === 'vs-dark';
  const bg = isDark ? '#1e1e2e' : '#ffffff';
  const fg = isDark ? '#cdd6f4' : '#1e1e2e';
  const border = isDark ? '#313244' : '#e0e0e0';
  const sidebarBg = isDark ? '#181825' : '#f3f3f3';
  const activityBg = isDark ? '#11111b' : '#e8e8e8';
  const panelBg = isDark ? '#181825' : '#f5f5f5';
  const tabBg = isDark ? '#1e1e2e' : '#ffffff';
  const tabActiveBorder = '#89b4fa';
  const statusBg = isDark ? '#1e1e2e' : '#007acc';
  const statusFg = isDark ? '#cdd6f4' : '#ffffff';
  const hoverBg = isDark ? '#2a2d3e' : '#e8e8e8';

  return (
    <div
      ref={containerRef}
      className={`flex flex-col rounded-xl overflow-hidden border shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      style={{
        borderColor: border,
        height: isFullscreen ? '100vh' : 'calc(100vh - 180px)',
        minHeight: '500px',
        background: bg,
      }}
    >
      {/* ═══ TITLE BAR ═══ */}
      <div
        className="flex items-center justify-between px-3 h-9 shrink-0 select-none"
        style={{ background: activityBg, borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f38ba8] hover:bg-[#f38ba8]/80 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#fab387] hover:bg-[#fab387]/80 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#a6e3a1] hover:bg-[#a6e3a1]/80 cursor-pointer" />
          </div>
          <span className="text-[11px] ml-3" style={{ color: isDark ? '#6c7086' : '#666' }}>
            V-Connect Code Arena — {`solution${language.ext}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditorTheme(isDark ? 'light' : 'vs-dark')}
            className="p-1 rounded hover:bg-[#313244] transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" style={{ color: '#6c7086' }} /> : <Moon className="w-3.5 h-3.5" style={{ color: '#666' }} />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded hover:bg-[#313244] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" style={{ color: '#6c7086' }} /> : <Maximize2 className="w-3.5 h-3.5" style={{ color: '#6c7086' }} />}
          </button>
        </div>
      </div>

      {/* ═══ MAIN BODY ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Activity Bar ─── */}
        <div
          className="flex flex-col items-center py-2 gap-1 shrink-0"
          style={{ width: '48px', background: activityBg, borderRight: `1px solid ${border}` }}
        >
          {([
            { view: 'explorer' as SidebarView, icon: <FileCode2 className="w-5 h-5" />, title: 'Explorer' },
            { view: 'search' as SidebarView, icon: <Search className="w-5 h-5" />, title: 'Search' },
            { view: 'git' as SidebarView, icon: <GitBranch className="w-5 h-5" />, title: 'Source Control' },
            { view: 'extensions' as SidebarView, icon: <Puzzle className="w-5 h-5" />, title: 'Extensions' },
          ]).map((item) => (
            <button
              key={item.view}
              onClick={() => {
                if (sidebarView === item.view && showSidebar) {
                  setShowSidebar(false);
                } else {
                  setSidebarView(item.view);
                  setShowSidebar(true);
                }
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${sidebarView === item.view && showSidebar
                  ? 'text-white'
                  : `hover:text-white/70`
                }`}
              style={{
                color: sidebarView === item.view && showSidebar ? (isDark ? '#cdd6f4' : '#1e1e2e') : (isDark ? '#6c7086' : '#999'),
                borderLeft: sidebarView === item.view && showSidebar ? `2px solid ${tabActiveBorder}` : '2px solid transparent',
              }}
              title={item.title}
            >
              {item.icon}
            </button>
          ))}

          <div className="flex-1" />

          <button
            onClick={() => {
              setSidebarView('settings');
              setShowSidebar(true);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
            style={{ color: isDark ? '#6c7086' : '#999' }}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Sidebar ─── */}
        {showSidebar && (
          <div
            className="shrink-0 overflow-y-auto"
            style={{
              width: '240px',
              background: sidebarBg,
              borderRight: `1px solid ${border}`,
            }}
          >
            {/* Explorer */}
            {sidebarView === 'explorer' && (
              <div>
                <div className="px-4 py-2.5 text-[11px] font-semibold tracking-widest uppercase" style={{ color: isDark ? '#6c7086' : '#999' }}>
                  EXPLORER
                </div>
                <div className="px-2 pb-1">
                  <div className="text-[11px] font-medium px-2 py-1.5 tracking-wider uppercase" style={{ color: isDark ? '#cdd6f4' : '#333' }}>
                    V-CONNECT-ARENA
                  </div>
                </div>
                {fileTree.map((entry, i) => (
                  <FileTreeNode key={entry.name + i} entry={entry} />
                ))}

                {/* Problem info in explorer */}
                {problem && (
                  <div className="mt-4 border-t" style={{ borderColor: border }}>
                    <div className="px-4 py-2.5 text-[11px] font-semibold tracking-widest uppercase" style={{ color: isDark ? '#6c7086' : '#999' }}>
                      CURRENT PROBLEM
                    </div>
                    <div className="px-4 pb-3">
                      <p className="text-[13px] font-medium" style={{ color: fg }}>{problem.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${problem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400'
                          : problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                        {problem.difficulty}
                      </span>
                      <p className="text-[11px] mt-2 leading-relaxed opacity-70" style={{ color: fg }}>{problem.description?.substring(0, 150)}...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            {sidebarView === 'search' && (
              <div>
                <div className="px-4 py-2.5 text-[11px] font-semibold tracking-widest uppercase" style={{ color: isDark ? '#6c7086' : '#999' }}>
                  SEARCH
                </div>
                <div className="px-3 pb-2">
                  <div className="flex items-center rounded-md overflow-hidden" style={{ background: isDark ? '#313244' : '#e0e0e0' }}>
                    <Search className="w-3.5 h-3.5 mx-2 shrink-0" style={{ color: isDark ? '#6c7086' : '#999' }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent py-1.5 pr-2 text-[13px] outline-none"
                      style={{ color: fg }}
                    />
                  </div>
                </div>
                {searchQuery && (
                  <div className="px-4 py-2 text-[12px]" style={{ color: isDark ? '#6c7086' : '#999' }}>
                    {code.split('\n').filter(line => line.toLowerCase().includes(searchQuery.toLowerCase())).length} results in solution{language.ext}
                  </div>
                )}
              </div>
            )}

            {/* Git */}
            {sidebarView === 'git' && (
              <div>
                <div className="px-4 py-2.5 text-[11px] font-semibold tracking-widest uppercase" style={{ color: isDark ? '#6c7086' : '#999' }}>
                  SOURCE CONTROL
                </div>
                <div className="px-4 py-8 text-center text-[12px]" style={{ color: isDark ? '#6c7086' : '#999' }}>
                  <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="mb-1">No changes detected</p>
                  <p className="text-[11px] opacity-60">Your code is tracked in the Code Arena</p>
                </div>
              </div>
            )}

            {/* Extensions */}
            {sidebarView === 'extensions' && (
              <div>
                <div className="px-4 py-2.5 text-[11px] font-semibold tracking-widest uppercase" style={{ color: isDark ? '#6c7086' : '#999' }}>
                  EXTENSIONS
                </div>
                <div className="px-3 pb-2">
                  <div className="flex items-center rounded-md overflow-hidden" style={{ background: isDark ? '#313244' : '#e0e0e0' }}>
                    <Search className="w-3.5 h-3.5 mx-2 shrink-0" style={{ color: isDark ? '#6c7086' : '#999' }} />
                    <input
                      type="text"
                      placeholder="Search extensions..."
                      className="w-full bg-transparent py-1.5 pr-2 text-[13px] outline-none"
                      style={{ color: fg }}
                    />
                  </div>
                </div>

                <div className="px-2 py-1 text-[11px] font-medium tracking-wider uppercase" style={{ color: isDark ? '#cdd6f4' : '#333' }}>
                  INSTALLED
                </div>
                {EXTENSIONS.filter(e => installedExtensions.has(e.id)).map(ext => (
                  <div key={ext.id} className="flex items-start gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-[#2a2d3e]">
                    <span className="text-lg mt-0.5">{ext.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: fg }}>{ext.name}</p>
                      <p className="text-[11px] truncate" style={{ color: isDark ? '#6c7086' : '#999' }}>{ext.desc}</p>
                      <p className="text-[10px]" style={{ color: isDark ? '#45475a' : '#ccc' }}>{ext.author}</p>
                    </div>
                    <button
                      onClick={() => {
                        const next = new Set(installedExtensions);
                        next.delete(ext.id);
                        setInstalledExtensions(next);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded mt-1 shrink-0"
                      style={{
                        background: isDark ? '#313244' : '#e0e0e0',
                        color: isDark ? '#cdd6f4' : '#333',
                      }}
                    >
                      Disable
                    </button>
                  </div>
                ))}

                <div className="px-2 py-1 mt-2 text-[11px] font-medium tracking-wider uppercase" style={{ color: isDark ? '#cdd6f4' : '#333' }}>
                  RECOMMENDED
                </div>
                {EXTENSIONS.filter(e => !installedExtensions.has(e.id)).map(ext => (
                  <div key={ext.id} className="flex items-start gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-[#2a2d3e]">
                    <span className="text-lg mt-0.5">{ext.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: fg }}>{ext.name}</p>
                      <p className="text-[11px] truncate" style={{ color: isDark ? '#6c7086' : '#999' }}>{ext.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setInstalledExtensions(prev => new Set([...prev, ext.id]));
                      }}
                      className="text-[10px] px-2 py-0.5 rounded mt-1 shrink-0 font-medium"
                      style={{
                        background: '#89b4fa',
                        color: '#1e1e2e',
                      }}
                    >
                      Install
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Settings */}
            {sidebarView === 'settings' && (
              <div>
                <div className="px-4 py-2.5 text-[11px] font-semibold tracking-widest uppercase" style={{ color: isDark ? '#6c7086' : '#999' }}>
                  SETTINGS
                </div>
                <div className="px-4 space-y-4 py-2">
                  <div>
                    <label className="text-[11px] font-medium block mb-1.5" style={{ color: isDark ? '#6c7086' : '#666' }}>Font Size</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={fontSize}
                        onChange={e => setFontSize(Number(e.target.value))}
                        className="flex-1 accent-[#89b4fa]"
                      />
                      <span className="text-[12px] w-8 text-right" style={{ color: fg }}>{fontSize}px</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium block mb-1.5" style={{ color: isDark ? '#6c7086' : '#666' }}>Theme</label>
                    <select
                      value={editorTheme}
                      onChange={e => setEditorTheme(e.target.value as 'vs-dark' | 'light')}
                      className="w-full text-[12px] rounded px-2 py-1.5 outline-none"
                      style={{ background: isDark ? '#313244' : '#e0e0e0', color: fg }}
                    >
                      <option value="vs-dark">V-Connect Dark (Catppuccin)</option>
                      <option value="light">V-Connect Light</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[12px]" style={{ color: fg }}>Word Wrap</label>
                    <button
                      onClick={() => setWordWrap(!wordWrap)}
                      className="px-3 py-1 rounded text-[11px] font-medium transition-colors"
                      style={{ background: wordWrap ? '#89b4fa' : (isDark ? '#313244' : '#e0e0e0'), color: wordWrap ? '#1e1e2e' : fg }}
                    >
                      {wordWrap ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[12px]" style={{ color: fg }}>Minimap</label>
                    <button
                      onClick={() => setMinimap(!minimap)}
                      className="px-3 py-1 rounded text-[11px] font-medium transition-colors"
                      style={{ background: minimap ? '#89b4fa' : (isDark ? '#313244' : '#e0e0e0'), color: minimap ? '#1e1e2e' : fg }}
                    >
                      {minimap ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Editor Area ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div
            className="flex items-center shrink-0 overflow-x-auto"
            style={{ background: isDark ? '#11111b' : '#e8e8e8', borderBottom: `1px solid ${border}`, height: '36px' }}
          >
            {/* Language file tab */}
            <div
              className="flex items-center gap-1.5 px-3 h-full cursor-pointer border-r shrink-0"
              style={{
                background: tabBg,
                borderColor: border,
                borderTop: `2px solid ${tabActiveBorder}`,
              }}
            >
              {getFileIcon(`solution${language.ext}`)}
              <span className="text-[12px]" style={{ color: fg }}>solution{language.ext}</span>
              <X className="w-3 h-3 ml-1 opacity-0 hover:opacity-100 transition-opacity" style={{ color: isDark ? '#6c7086' : '#999' }} />
            </div>
            {/* Input tab */}
            <div
              className="flex items-center gap-1.5 px-3 h-full cursor-pointer border-r shrink-0"
              style={{
                background: isDark ? '#11111b' : '#e8e8e8',
                borderColor: border,
              }}
              onClick={() => { }}
            >
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[12px] opacity-60" style={{ color: fg }}>input.txt</span>
            </div>

            <div className="flex-1" />

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 shrink-0">
              {/* Language Selector */}
              <select
                value={language.id}
                onChange={e => handleLanguageChange(e.target.value)}
                className="text-[11px] rounded px-2 py-1 outline-none border-none cursor-pointer font-medium mr-1"
                style={{ background: isDark ? '#313244' : '#e0e0e0', color: fg }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>{l.icon} {l.label}</option>
                ))}
              </select>

              <button onClick={handleCopy} className="p-1.5 rounded transition-colors" style={{ color: isDark ? '#6c7086' : '#999' }} title="Copy Code">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleDownload} className="p-1.5 rounded transition-colors" style={{ color: isDark ? '#6c7086' : '#999' }} title="Download">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleReset} className="p-1.5 rounded transition-colors" style={{ color: isDark ? '#6c7086' : '#999' }} title="Reset Code">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Run Button */}
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium transition-all ml-1"
                style={{
                  background: isRunning ? '#45475a' : '#a6e3a1',
                  color: '#1e1e2e',
                }}
              >
                {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? 'Running...' : 'Run'}
              </button>

              {/* Submit Button (for students with a problem) */}
              {isStudent && problem && onSubmitCode && (
                <button
                  onClick={() => onSubmitCode(language.id, code)}
                  disabled={submitting || !code.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium transition-all ml-1"
                  style={{
                    background: submitting ? '#45475a' : '#89b4fa',
                    color: '#1e1e2e',
                  }}
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Submit
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          <div
            className="flex items-center gap-1 px-4 py-1 text-[11px] shrink-0"
            style={{ background: bg, borderBottom: `1px solid ${border}`, color: isDark ? '#6c7086' : '#999' }}
          >
            <span>v-connect-arena</span>
            <ChevronRight className="w-3 h-3" />
            <span>src</span>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: fg }}>solution{language.ext}</span>
          </div>

          {/* Editor + Panel Split */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={language.id === 'cpp' ? 'cpp' : language.id === 'c' ? 'c' : language.id}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorMount}
                theme={editorTheme === 'vs-dark' ? 'vconnect-dark' : 'vconnect-light'}
                options={{
                  fontSize,
                  fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
                  fontLigatures: true,
                  minimap: { enabled: minimap },
                  wordWrap: wordWrap ? 'on' : 'off',
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
                  glyphMargin: true,
                  folding: true,
                  links: true,
                  contextmenu: true,
                  quickSuggestions: true,
                  parameterHints: { enabled: true },
                  tabSize: language.id === 'python' ? 4 : 2,
                }}
              />
            </div>

            {/* ─── Bottom Panel ─── */}
            {showPanel && (
              <div
                style={{
                  height: `${panelHeight}px`,
                  background: panelBg,
                  borderTop: `1px solid ${border}`,
                }}
                className="shrink-0 flex flex-col overflow-hidden"
              >
                {/* Panel Tabs */}
                <div
                  className="flex items-center justify-between shrink-0 px-2"
                  style={{ borderBottom: `1px solid ${border}`, background: isDark ? '#181825' : '#f0f0f0' }}
                >
                  <div className="flex items-center">
                    {([
                      { id: 'output' as PanelType, label: 'OUTPUT', icon: <Code2 className="w-3.5 h-3.5" /> },
                      { id: 'terminal' as PanelType, label: 'TERMINAL', icon: <TerminalIcon className="w-3.5 h-3.5" /> },
                      { id: 'problems' as PanelType, label: `PROBLEMS${problemsList.length > 0 ? ` (${problemsList.length})` : ''}`, icon: <AlertCircle className="w-3.5 h-3.5" /> },
                      { id: 'debug' as PanelType, label: 'INPUT', icon: <Bug className="w-3.5 h-3.5" /> },
                    ]).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setActivePanel(p.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium tracking-wider transition-colors"
                        style={{
                          color: activePanel === p.id ? fg : (isDark ? '#6c7086' : '#999'),
                          borderBottom: activePanel === p.id ? `2px solid ${tabActiveBorder}` : '2px solid transparent',
                        }}
                      >
                        {p.icon}
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setPanelHeight(h => Math.min(h + 50, 400))}
                      className="p-1 rounded transition-colors"
                      style={{ color: isDark ? '#6c7086' : '#999' }}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPanelHeight(h => Math.max(h - 50, 120))}
                      className="p-1 rounded transition-colors"
                      style={{ color: isDark ? '#6c7086' : '#999' }}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowPanel(false)} className="p-1 rounded transition-colors" style={{ color: isDark ? '#6c7086' : '#999' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-auto font-mono text-[12px] p-3" style={{ color: fg }}>
                  {activePanel === 'output' && (
                    <div>
                      {output ? (
                        <div>
                          {runTime !== null && (
                            <div className="flex items-center gap-3 mb-2 pb-2" style={{ borderBottom: `1px solid ${border}` }}>
                              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#a6e3a1' }}>
                                <Clock className="w-3 h-3" /> {runTime}ms
                              </span>
                              <span className="text-[11px]" style={{ color: isDark ? '#6c7086' : '#999' }}>|</span>
                              <span className="text-[11px]" style={{ color: '#89b4fa' }}>{language.label}</span>
                            </div>
                          )}
                          <pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-40">
                          <p>Run your code to see output here (Ctrl+Enter)</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activePanel === 'terminal' && (
                    <div>
                      {terminalHistory.map((line, i) => (
                        <div key={i} className="leading-5">
                          {line.split(/\x1b\[(\d+)m/).reduce((acc: React.ReactNode[], part, idx) => {
                            if (idx % 2 === 0) {
                              acc.push(<span key={idx}>{part}</span>);
                            }
                            return acc;
                          }, [])}
                          {!line.includes('\x1b') && line}
                        </div>
                      ))}
                      <div className="flex items-center gap-1 mt-1">
                        <span style={{ color: '#a6e3a1' }}>❯</span>
                        <span className="animate-pulse">▊</span>
                      </div>
                    </div>
                  )}

                  {activePanel === 'problems' && (
                    <div>
                      {problemsList.length === 0 ? (
                        <div className="flex items-center justify-center h-full opacity-40">
                          <p>No problems detected ✓</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {problemsList.map((p, i) => (
                            <div key={i} className="flex items-start gap-2 py-1">
                              {p.severity === 'error' ? (
                                <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#f38ba8]" />
                              ) : p.severity === 'warning' ? (
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#fab387]" />
                              ) : (
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#89b4fa]" />
                              )}
                              <span className="text-[11px]">{p.msg}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activePanel === 'debug' && (
                    <div className="h-full flex flex-col">
                      <div className="text-[11px] mb-1.5 font-medium" style={{ color: isDark ? '#6c7086' : '#999' }}>
                        STDIN — Provide input for your program
                      </div>
                      <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Enter your input here..."
                        className="flex-1 w-full bg-transparent outline-none resize-none text-[13px] rounded-md p-2"
                        style={{
                          background: isDark ? '#1e1e2e' : '#fff',
                          color: fg,
                          border: `1px solid ${border}`,
                        }}
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div
        className="flex items-center justify-between px-3 h-6 shrink-0 select-none"
        style={{
          background: isDark ? '#181825' : '#007acc',
          borderTop: `1px solid ${border}`,
          color: isDark ? '#6c7086' : '#ffffff',
        }}
      >
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> main
          </span>
          <span className="flex items-center gap-1">
            {problemsList.length === 0 ? (
              <><CheckCircle2 className="w-3 h-3" /> 0 errors</>
            ) : (
              <><XCircle className="w-3 h-3 text-[#f38ba8]" /> {problemsList.length} errors</>
            )}
          </span>
          {!showPanel && (
            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-1 hover:underline"
            >
              <TerminalIcon className="w-3 h-3" /> Terminal
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {runTime !== null && (
            <span className="flex items-center gap-1" style={{ color: isDark ? '#a6e3a1' : '#fff' }}>
              <Clock className="w-3 h-3" /> {runTime}ms
            </span>
          )}
          <span>{language.label}</span>
          <span>UTF-8</span>
          <span>Ln {code.split('\n').length}, Col 1</span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3" /> Piston API
          </span>
          <span className="flex items-center gap-1">
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            {isRunning ? 'Executing...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Submit Result */}
      {submitResult && (
        <div
          className="mx-4 mb-3 mt-1 p-3 rounded-lg text-[13px]"
          style={{
            background: submitResult.status === 'ACCEPTED' ? '#a6e3a120' : '#f38ba820',
            border: `1px solid ${submitResult.status === 'ACCEPTED' ? '#a6e3a1' : '#f38ba8'}`,
            color: submitResult.status === 'ACCEPTED' ? '#a6e3a1' : '#f38ba8',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {submitResult.status === 'ACCEPTED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="font-semibold">{submitResult.status === 'ACCEPTED' ? '✅ Accepted!' : `❌ ${submitResult.status}`}</span>
              <span className="opacity-70 text-[11px]">Tests: {submitResult.testsPassed}/{submitResult.totalTests}</span>
            </div>
            {submitResult.vPointsEarned > 0 && (
              <span className="flex items-center gap-1 text-[#cba6f7] font-bold">
                <Flame className="w-4 h-4" /> +{submitResult.vPointsEarned} V-Points
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
