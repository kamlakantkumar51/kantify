import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  card: "#1a1a28",
  border: "#2a2a3d",
  accent: "#7c5cfc",
  accentGlow: "#7c5cfc44",
  accentSoft: "#7c5cfc22",
  green: "#22d3a5",
  greenSoft: "#22d3a522",
  amber: "#f59e0b",
  amberSoft: "#f59e0b22",
  red: "#f43f5e",
  redSoft: "#f43f5e22",
  text: "#e8e8f0",
  muted: "#6b6b8a",
  dim: "#3a3a55",
};

const PRIORITIES = {
  High: { color: COLORS.red, bg: COLORS.redSoft, icon: "🔴" },
  Medium: { color: COLORS.amber, bg: COLORS.amberSoft, icon: "🟡" },
  Low: { color: COLORS.green, bg: COLORS.greenSoft, icon: "🟢" },
};

const CATEGORIES = ["LeetCode", "DSA", "Web Dev", "Revision", "Projects", "Other"];

const INITIAL_TASKS = [
  { id: 1, title: "Solve 3 LeetCode Medium problems", category: "LeetCode", priority: "High", due: new Date().toISOString().split("T")[0], completed: false, notes: "Focus on sliding window & two pointers" },
  { id: 2, title: "Study Binary Trees — DFS & BFS", category: "DSA", priority: "High", due: new Date().toISOString().split("T")[0], completed: false, notes: "Cover inorder, preorder, postorder" },
  { id: 3, title: "Build REST API with Express", category: "Web Dev", priority: "Medium", due: new Date().toISOString().split("T")[0], completed: true, notes: "JWT auth done ✓" },
  { id: 4, title: "Revise Dynamic Programming basics", category: "Revision", priority: "Medium", due: new Date(Date.now() + 86400000).toISOString().split("T")[0], completed: false, notes: "" },
  { id: 5, title: "Push project to GitHub", category: "Projects", priority: "Low", due: new Date(Date.now() + 86400000).toISOString().split("T")[0], completed: true, notes: "" },
  { id: 6, title: "Complete React hooks deep dive", category: "Web Dev", priority: "High", due: new Date(Date.now() - 86400000).toISOString().split("T")[0], completed: false, notes: "useCallback, useMemo, useRef" },
];

const AI_RESPONSES = {
  pending: (tasks) => {
    const p = tasks.filter(t => !t.completed);
    if (!p.length) return "🎉 Amazing! You have **no pending tasks**. You're crushing it today!";
    return `📋 You have **${p.length} pending tasks**:\n${p.map(t => `• **${t.title}** [${t.priority}]`).join("\n")}\n\n💡 Tip: Start with the High priority ones first!`;
  },
  completed: (tasks) => {
    const c = tasks.filter(t => t.completed);
    if (!c.length) return "No completed tasks yet. Let's get moving — pick a task and crush it! 💪";
    return `✅ You've completed **${c.length} tasks** — great work!\n${c.map(t => `• ~~${t.title}~~`).join("\n")}`;
  },
  focus: (tasks) => {
    const high = tasks.filter(t => !t.completed && t.priority === "High");
    const overdue = tasks.filter(t => !t.completed && new Date(t.due) < new Date());
    if (overdue.length) return `⚠️ You have **${overdue.length} overdue tasks**! Focus here first:\n${overdue.map(t => `• **${t.title}**`).join("\n")}\n\nDon't panic — tackle them one at a time. You've got this! 🔥`;
    if (high.length) return `🎯 Focus on these **High priority tasks** today:\n${high.map(t => `• **${t.title}** (${t.category})`).join("\n")}\n\n⏱ Try the Pomodoro technique: 25 min work → 5 min break.`;
    return "✨ You're on top of things! No urgent tasks. Keep up the momentum and plan tomorrow.";
  },
  dsa: () => "📚 **DSA Study Plan for today:**\n• 1hr — Study one data structure deeply\n• 30min — Solve 2 easy + 1 medium LeetCode\n• 20min — Revise yesterday's topics\n\n🧠 Consistency > Intensity. Daily 2hrs > weekend marathons!",
  productivity: (tasks) => {
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `📊 **Your productivity today: ${pct}%**\n\n${pct >= 70 ? "🔥 Excellent work!" : pct >= 40 ? "💪 Good progress — keep going!" : "🌱 Just getting started — every task counts!"}\n\n• Total tasks: ${total}\n• Completed: ${done}\n• Remaining: ${total - done}\n\n${pct < 100 ? "Focus on one task at a time. You can do this! 🎯" : "Perfect day! 🏆"}`;
  },
  default: () => "I'm your AI productivity assistant! Try asking:\n• **'What tasks are pending?'**\n• **'Show completed work'**\n• **'What should I focus on?'**\n• **'Give me a DSA plan'**\n• **'How productive am I?'**",
};

function getAIReply(input, tasks) {
  const q = input.toLowerCase();
  if (q.includes("pending") || q.includes("todo") || q.includes("remaining")) return AI_RESPONSES.pending(tasks);
  if (q.includes("complet") || q.includes("done") || q.includes("finish")) return AI_RESPONSES.completed(tasks);
  if (q.includes("focus") || q.includes("first") || q.includes("priority") || q.includes("urgent")) return AI_RESPONSES.focus(tasks);
  if (q.includes("dsa") || q.includes("leetcode") || q.includes("algorithm") || q.includes("plan")) return AI_RESPONSES.dsa();
  if (q.includes("productiv") || q.includes("progress") || q.includes("stats") || q.includes("how am")) return AI_RESPONSES.productivity(tasks);
  return AI_RESPONSES.default();
}

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────
function PomodoroTimer() {
  const [mins, setMins] = useState(25);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("work");
  const [cycles, setCycles] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSecs(s => {
          if (s === 0) {
            setMins(m => {
              if (m === 0) {
                setRunning(false);
                const next = mode === "work" ? "break" : "work";
                setMode(next);
                if (mode === "work") setCycles(c => c + 1);
                setMins(next === "work" ? 25 : 5);
                setSecs(0);
                return next === "work" ? 25 : 5;
              }
              return m - 1;
            });
            return 59;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [running, mode]);

  const reset = () => { setRunning(false); setMins(mode === "work" ? 25 : 5); setSecs(0); };
  const progress = mode === "work" ? ((25 * 60 - mins * 60 - secs) / (25 * 60)) * 100 : ((5 * 60 - mins * 60 - secs) / (5 * 60)) * 100;
  const circumference = 2 * Math.PI * 45;

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>🍅 POMODORO</span>
        <span style={{ color: COLORS.accent }}>Cycles: {cycles}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
        {["work", "break"].map(m => (
          <button key={m} onClick={() => { setMode(m); setMins(m === "work" ? 25 : 5); setSecs(0); setRunning(false); }}
            style={{ padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: mode === m ? COLORS.accent : COLORS.dim, color: mode === m ? "#fff" : COLORS.muted }}>
            {m === "work" ? "Focus" : "Break"}
          </button>
        ))}
      </div>
      <svg width="120" height="120" style={{ display: "block", margin: "0 auto 12px" }}>
        <circle cx="60" cy="60" r="45" fill="none" stroke={COLORS.dim} strokeWidth="6" />
        <circle cx="60" cy="60" r="45" fill="none" stroke={mode === "work" ? COLORS.accent : COLORS.green}
          strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference}
          strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 0.5s" }} />
        <text x="60" y="56" textAnchor="middle" fill={COLORS.text} fontSize="22" fontWeight="700" fontFamily="monospace">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </text>
        <text x="60" y="74" textAnchor="middle" fill={COLORS.muted} fontSize="10">
          {mode === "work" ? "FOCUS" : "BREAK"}
        </text>
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <button onClick={() => setRunning(r => !r)}
          style={{ padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            background: running ? COLORS.redSoft : COLORS.accent, color: running ? COLORS.red : "#fff", fontWeight: 700, fontSize: 13 }}>
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
        <button onClick={reset}
          style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, cursor: "pointer",
            background: "transparent", color: COLORS.muted, fontSize: 13 }}>↺</button>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 20px",
      boxShadow: `0 0 20px ${color}18` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6, fontWeight: 600, letterSpacing: "0.08em" }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Space Mono', monospace" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 24, opacity: 0.8 }}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const p = PRIORITIES[task.priority];
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = !task.completed && task.due < today;
  const isDueToday = task.due === today;

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${isOverdue ? COLORS.red + "44" : COLORS.border}`,
      borderLeft: `3px solid ${task.completed ? COLORS.dim : p.color}`, borderRadius: 12,
      padding: "12px 16px", marginBottom: 8, opacity: task.completed ? 0.65 : 1,
      transition: "all 0.2s", boxShadow: isOverdue ? `0 0 12px ${COLORS.redSoft}` : "none" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <button onClick={() => onToggle(task.id)}
          style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${task.completed ? COLORS.green : COLORS.dim}`,
            background: task.completed ? COLORS.green : "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          {task.completed && <span style={{ color: "#000", fontSize: 11 }}>✓</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: task.completed ? COLORS.muted : COLORS.text,
            textDecoration: task.completed ? "line-through" : "none", marginBottom: 4 }}>
            {task.title}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: p.bg, color: p.color, fontWeight: 700 }}>
              {p.icon} {task.priority}
            </span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: COLORS.accentSoft, color: COLORS.accent, fontWeight: 600 }}>
              {task.category}
            </span>
            {isOverdue && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: COLORS.redSoft, color: COLORS.red, fontWeight: 700 }}>⚠ Overdue</span>}
            {isDueToday && !isOverdue && !task.completed && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: COLORS.amberSoft, color: COLORS.amber, fontWeight: 700 }}>📅 Today</span>}
            <span style={{ fontSize: 10, color: COLORS.muted }}>📆 {task.due}</span>
          </div>
          {task.notes && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 5, fontStyle: "italic" }}>💬 {task.notes}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(task)} style={{ background: COLORS.accentSoft, border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: COLORS.accent, fontSize: 12 }}>✏</button>
          <button onClick={() => onDelete(task.id)} style={{ background: COLORS.redSoft, border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: COLORS.red, fontSize: 12 }}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
function AIChat({ tasks }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hey! 👋 I'm your AI productivity assistant. I know your tasks, priorities, and schedule. Ask me anything!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const SUGGESTIONS = ["What's pending today?", "What should I focus on?", "Show my progress", "Give me a DSA plan"];

  const send = (text) => {
    const q = text || input;
    if (!q.trim()) return;
    setMessages(m => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: "ai", text: getAIReply(q, tasks) }]);
      setLoading(false);
    }, 800);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const renderText = (text) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} style={{ marginBottom: line === "" ? 6 : 2 }}>
          {parts.map((part, j) => j % 2 === 1
            ? <strong key={j} style={{ color: COLORS.accent }}>{part}</strong>
            : <span key={j}>{part}</span>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, display: "flex", flexDirection: "column", height: 420 }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.green})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>AI Assistant</div>
          <div style={{ fontSize: 11, color: COLORS.green, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green, display: "inline-block" }}></span> Online
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.role === "user" ? COLORS.accent : COLORS.surface,
              border: m.role === "ai" ? `1px solid ${COLORS.border}` : "none",
              color: COLORS.text, fontSize: 13, lineHeight: 1.6 }}>
              {renderText(m.text)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 16px", borderRadius: "14px 14px 14px 4px", background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.accent,
                    animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "8px 12px", borderTop: `1px solid ${COLORS.border}`, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)}
            style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, border: `1px solid ${COLORS.border}`,
              background: COLORS.accentSoft, color: COLORS.accent, cursor: "pointer", fontWeight: 500 }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask your AI assistant..."
          style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
            padding: "8px 12px", color: COLORS.text, fontSize: 13, outline: "none" }} />
        <button onClick={() => send()}
          style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: COLORS.accent,
            color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>➤</button>
      </div>
    </div>
  );
}

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState(task || { title: "", category: "LeetCode", priority: "Medium", due: today, notes: "", completed: false });

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: 24, width: "100%", maxWidth: 460,
        boxShadow: `0 0 60px ${COLORS.accentGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: COLORS.text, fontSize: 18, fontWeight: 700 }}>{task ? "✏ Edit Task" : "✨ Add New Task"}</h3>
          <button onClick={onClose} style={{ background: COLORS.redSoft, border: "none", borderRadius: 8, padding: "4px 10px", color: COLORS.red, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {[
          { label: "Task Title *", key: "title", type: "text", placeholder: "e.g., Solve 5 LeetCode problems" },
          { label: "Due Date", key: "due", type: "date" },
          { label: "Notes", key: "notes", type: "text", placeholder: "Optional notes..." },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{f.label}</label>
            <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} type={f.type}
              placeholder={f.placeholder}
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none", boxSizing: "border-box",
                colorScheme: "dark" }} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Priority</label>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none" }}>
              {["High", "Medium", "Low"].map(p => <option key={p} value={p}>{PRIORITIES[p].icon} {p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "transparent",
              color: COLORS.muted, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
          <button onClick={() => { if (form.title.trim()) onSave(form); }}
            style={{ flex: 2, padding: 11, borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${COLORS.accent}, #a855f7)`,
              color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            {task ? "Save Changes" : "✨ Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 80, stroke = 7, color = COLORS.accent }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.dim} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill={COLORS.text} fontSize="14" fontWeight="700" fontFamily="monospace">{pct}%</text>
    </svg>
  );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ tasks }) {
  const cats = CATEGORIES.map(c => ({ name: c, total: tasks.filter(t => t.category === c).length, done: tasks.filter(t => t.category === c && t.completed).length })).filter(c => c.total > 0);
  const max = Math.max(...cats.map(c => c.total), 1);
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 14 }}>📊 BY CATEGORY</div>
      {cats.map(c => (
        <div key={c.name} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: COLORS.text }}>{c.name}</span>
            <span style={{ fontSize: 11, color: COLORS.muted }}>{c.done}/{c.total}</span>
          </div>
          <div style={{ height: 6, borderRadius: 10, background: COLORS.dim, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 10, background: c.done === c.total && c.total > 0 ? COLORS.green : COLORS.accent,
              width: `${(c.total / max) * 100}%`, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 10,
                background: c.done === c.total && c.total > 0 ? COLORS.green : "#a855f7",
                width: `${c.total > 0 ? (c.done / c.total) * 100 : 0}%`, opacity: 0.6 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [view, setView] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterPri, setFilterPri] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const todayTasks = tasks.filter(t => t.due === today);
  const overdue = tasks.filter(t => !t.completed && t.due < today);

  const notify = (msg, color = COLORS.accent) => {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (overdue.length) {
      setTimeout(() => notify(`⚠️ ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}! Check your tasks.`, COLORS.red), 1500);
    }
  }, []);

  const addTask = (form) => {
    const newTask = { ...form, id: Date.now() };
    setTasks(t => [...t, newTask]);
    setModal(null);
    notify("✨ Task added successfully!");
  };

  const updateTask = (form) => {
    setTasks(t => t.map(x => x.id === editTask.id ? { ...x, ...form } : x));
    setEditTask(null);
    setModal(null);
    notify("✅ Task updated!");
  };

  const deleteTask = (id) => {
    setTasks(t => t.filter(x => x.id !== id));
    notify("🗑 Task deleted", COLORS.red);
  };

  const toggleTask = (id) => {
    setTasks(t => t.map(x => x.id === id ? { ...x, completed: !x.completed } : x));
  };

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.notes.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== "All" && t.category !== filterCat) return false;
    if (filterPri !== "All" && t.priority !== filterPri) return false;
    if (filterStatus === "Pending" && t.completed) return false;
    if (filterStatus === "Completed" && !t.completed) return false;
    if (filterStatus === "Today" && t.due !== today) return false;
    if (filterStatus === "Overdue" && (t.completed || t.due >= today)) return false;
    return true;
  });

  const NAV = [
    { id: "dashboard", icon: "⚡", label: "Dashboard" },
    { id: "tasks", icon: "📋", label: "Tasks" },
    { id: "ai", icon: "🤖", label: "AI Assistant" },
    { id: "pomodoro", icon: "🍅", label: "Pomodoro" },
    { id: "notes", icon: "📝", label: "Notes" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', -apple-system, sans-serif", display: "flex" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.dim}; border-radius: 4px; }
        input, select { color-scheme: dark; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .nav-item:hover { background: ${COLORS.accentSoft} !important; color: ${COLORS.accent} !important; }
        .task-card:hover { border-color: ${COLORS.accent}44 !important; }

        /* Sidebar Backdrop */
        .sidebar-backdrop {
          display: none;
        }

        /* Responsive Grids & Layouts */
        .dashboard-mid-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .dashboard-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .notes-view-grid {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 16px;
          animation: fadeIn 0.3s ease;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .dashboard-mid-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          /* App Topbar adjustment */
          .app-topbar {
            padding: 12px 16px !important;
          }

          /* Mobile Sidebar styles */
          .app-sidebar {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            height: 100vh !important;
            width: 220px !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease-in-out !important;
          }

          .app-sidebar.open {
            transform: translateX(0) !important;
          }

          /* Backdrop */
          .sidebar-backdrop {
            display: block !important;
          }

          /* Mobile Hamburger Button */
          .sidebar-toggle-mobile {
            display: block !important;
          }

          /* Content Padding adjustment */
          .page-content {
            padding: 16px !important;
          }

          /* Grids to single column */
          .dashboard-mid-grid {
            grid-template-columns: 1fr !important;
          }

          .dashboard-bottom-grid {
            grid-template-columns: 1fr !important;
          }

          .notes-view-grid {
            grid-template-columns: 1fr !important;
          }

          /* Mobile Topbar Adjustments */
          .topbar-date {
            display: none !important;
          }
          
          .topbar-overdue {
            padding: 4px 8px !important;
            font-size: 10px !important;
          }

          .new-task-button {
            padding: 7px 12px !important;
            font-size: 11px !important;
          }

          /* Mobile Filters Adjustments */
          .filters-container {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .filters-container input,
          .filters-container select {
            width: 100% !important;
          }

          /* Mobile Notes Detail View Stacking */
          .notes-list-container.mobile-hide {
            display: none !important;
          }

          .note-editor-container.mobile-hide {
            display: none !important;
          }

          .note-back-button {
            display: inline-block !important;
          }
        }
      `}</style>

      {/* Sidebar Backdrop for Mobile */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />
      )}

      {/* Sidebar */}
      <div className={`app-sidebar ${sidebarOpen ? "open" : ""}`} style={{ width: sidebarOpen ? 220 : 64, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
        display: "flex", flexDirection: "column", transition: "width 0.25s", overflow: "hidden", flexShrink: 0, zIndex: 100 }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, ${COLORS.accent}, #a855f7)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
            {sidebarOpen && <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.text, letterSpacing: "-0.02em" }}>kantTasks</div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>Your AI Study Coach</div>
            </div>}
            <button onClick={() => setSidebarOpen(s => !s)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 16, flexShrink: 0 }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setView(n.id); if (window.innerWidth <= 768) setSidebarOpen(false); }} className="nav-item"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
                borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left",
                transition: "all 0.15s",
                background: view === n.id ? COLORS.accentSoft : "transparent",
                color: view === n.id ? COLORS.accent : COLORS.muted, fontWeight: view === n.id ? 700 : 500, fontSize: 13 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{n.label}</span>}
              {sidebarOpen && n.id === "tasks" && pending > 0 && (
                <span style={{ marginLeft: "auto", background: COLORS.accent, color: "#fff", borderRadius: 20,
                  padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{pending}</span>
              )}
            </button>
          ))}
        </nav>

        {sidebarOpen && <div style={{ padding: "12px 14px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}>Today's Progress</div>
          <div style={{ height: 5, borderRadius: 10, background: COLORS.dim, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 10, background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.green})`,
              width: `${pct}%`, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 12, color: COLORS.accent, marginTop: 5, fontWeight: 700, fontFamily: "monospace" }}>{pct}% complete</div>
        </div>}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div className="app-topbar" style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "12px 24px",
          display: "flex", alignItems: "center", gap: 12 }}>
          <button className="sidebar-toggle-mobile" onClick={() => setSidebarOpen(s => !s)}
            style={{ background: "none", border: "none", color: COLORS.text, fontSize: 20, cursor: "pointer", marginRight: 8, display: "none" }}>
            ☰
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>
              {NAV.find(n => n.id === view)?.icon} {NAV.find(n => n.id === view)?.label}
            </div>
            <div className="topbar-date" style={{ fontSize: 11, color: COLORS.muted }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          {overdue.length > 0 && (
            <div className="topbar-overdue" style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, background: COLORS.redSoft,
              color: COLORS.red, fontWeight: 700, animation: "pulse 2s infinite" }}>
              ⚠ {overdue.length} Overdue
            </div>
          )}
          <button className="new-task-button" onClick={() => { setEditTask(null); setModal("add"); }}
            style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${COLORS.accent}, #a855f7)`,
              color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
            + New Task
          </button>
        </div>

        {/* Page Content */}
        <div className="page-content" style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* ── DASHBOARD ── */}
          {view === "dashboard" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
                <StatCard label="TOTAL TASKS" value={total} icon="📋" color={COLORS.accent} sub="all tasks" />
                <StatCard label="COMPLETED" value={completed} icon="✅" color={COLORS.green} sub={`${pct}% done`} />
                <StatCard label="PENDING" value={pending} icon="⏳" color={COLORS.amber} sub="remaining" />
                <StatCard label="OVERDUE" value={overdue.length} icon="⚠️" color={overdue.length ? COLORS.red : COLORS.muted} sub="need attention" />
              </div>

              <div className="dashboard-mid-grid">
                {/* Progress */}
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.08em" }}>📈 OVERALL PROGRESS</div>
                  <ProgressRing pct={pct} size={100} stroke={8} color={pct >= 70 ? COLORS.green : pct >= 40 ? COLORS.amber : COLORS.accent} />
                  <div style={{ fontSize: 12, color: COLORS.muted, textAlign: "center" }}>
                    {pct >= 70 ? "🔥 Crushing it!" : pct >= 40 ? "💪 Good progress" : "🌱 Keep going!"}
                  </div>
                </div>

                {/* Today's tasks */}
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 12 }}>📅 TODAY'S TASKS</div>
                  {todayTasks.length === 0
                    ? <div style={{ color: COLORS.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No tasks due today 🎉</div>
                    : todayTasks.slice(0, 4).map(t => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: PRIORITIES[t.priority].color }} />
                        <span style={{ fontSize: 12, flex: 1, color: t.completed ? COLORS.muted : COLORS.text,
                          textDecoration: t.completed ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.title}
                        </span>
                        {t.completed && <span style={{ fontSize: 10, color: COLORS.green }}>✓</span>}
                      </div>
                    ))
                  }
                  {todayTasks.length > 4 && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>+{todayTasks.length - 4} more</div>}
                </div>

                {/* Priority breakdown */}
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 14 }}>🎯 PRIORITY SPLIT</div>
                  {["High", "Medium", "Low"].map(p => {
                    const cnt = tasks.filter(t => t.priority === p && !t.completed).length;
                    const all = tasks.filter(t => t.priority === p).length;
                    return (
                      <div key={p} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: PRIORITIES[p].color, fontWeight: 600 }}>{PRIORITIES[p].icon} {p}</span>
                          <span style={{ fontSize: 11, color: COLORS.muted }}>{cnt} pending / {all} total</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 10, background: COLORS.dim }}>
                          <div style={{ height: "100%", borderRadius: 10, background: PRIORITIES[p].color,
                            width: `${all ? (1 - cnt / all) * 100 : 0}%`, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dashboard-bottom-grid">
                <MiniBarChart tasks={tasks} />
                {/* Quick AI suggestion */}
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20,
                  background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.accentSoft})` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 12 }}>🤖 AI DAILY TIP</div>
                  <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, marginBottom: 16 }}>
                    {overdue.length > 0
                      ? `⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}. Clear them first before adding new ones.`
                      : pct === 0
                        ? "🌅 Fresh start! Tackle your most important task first — that's the secret to a productive day."
                        : pct < 50
                          ? "💪 Great momentum! Focus on High priority items. Avoid distractions for the next 25 mins."
                          : pct < 100
                            ? `🔥 Almost there! Just ${pending} task${pending > 1 ? "s" : ""} left. You've got this!`
                            : "🏆 PERFECT DAY! All tasks complete. Rest well — tomorrow's grind awaits!"
                    }
                  </div>
                  <button onClick={() => setView("ai")}
                    style={{ fontSize: 12, padding: "7px 16px", borderRadius: 10, border: `1px solid ${COLORS.accent}`,
                      background: COLORS.accentSoft, color: COLORS.accent, cursor: "pointer", fontWeight: 600 }}>
                    Chat with AI →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TASKS ── */}
          {view === "tasks" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {/* Filters */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div className="filters-container" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search tasks..."
                    style={{ flex: 1, minWidth: 180, background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      borderRadius: 9, padding: "8px 12px", color: COLORS.text, fontSize: 13, outline: "none" }} />
                  {[
                    { label: "Status", val: filterStatus, set: setFilterStatus, opts: ["All", "Pending", "Completed", "Today", "Overdue"] },
                    { label: "Category", val: filterCat, set: setFilterCat, opts: ["All", ...CATEGORIES] },
                    { label: "Priority", val: filterPri, set: setFilterPri, opts: ["All", "High", "Medium", "Low"] },
                  ].map(f => (
                    <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)}
                      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9,
                        padding: "8px 12px", color: COLORS.text, fontSize: 12, outline: "none" }}>
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ))}
                  <span style={{ fontSize: 11, color: COLORS.muted }}>{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              {/* Quick status tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {[
                  { label: `All (${tasks.length})`, v: "All" },
                  { label: `⏳ Pending (${pending})`, v: "Pending" },
                  { label: `✅ Done (${completed})`, v: "Completed" },
                  { label: `📅 Today (${todayTasks.length})`, v: "Today" },
                  { label: `⚠ Overdue (${overdue.length})`, v: "Overdue" },
                ].map(tab => (
                  <button key={tab.v} onClick={() => setFilterStatus(tab.v)}
                    style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filterStatus === tab.v ? COLORS.accent : COLORS.border}`,
                      background: filterStatus === tab.v ? COLORS.accentSoft : "transparent",
                      color: filterStatus === tab.v ? COLORS.accent : COLORS.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    {tab.label}
                  </button>
                ))}
              </div>
              {filtered.length === 0
                ? <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.muted }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>No tasks found</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Try changing filters or add a new task</div>
                  </div>
                : filtered.map(t => (
                  <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask}
                    onEdit={(task) => { setEditTask(task); setModal("edit"); }} />
                ))
              }
            </div>
          )}

          {/* ── AI ASSISTANT ── */}
          {view === "ai" && (
            <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 700 }}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16, marginBottom: 16,
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                {[
                  { label: "Tasks analyzed", val: total, icon: "🧠" },
                  { label: "Completed", val: completed, icon: "✅" },
                  { label: "Overdue alerts", val: overdue.length, icon: "⚠️" },
                  { label: "Productivity", val: `${pct}%`, icon: "📈" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.accent, fontFamily: "monospace" }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <AIChat tasks={tasks} />
            </div>
          )}

          {/* ── POMODORO ── */}
          {view === "pomodoro" && (
            <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 400 }}>
              <PomodoroTimer />
              <div style={{ marginTop: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 12 }}>📋 WORK ON NEXT</div>
                {tasks.filter(t => !t.completed && t.priority === "High").slice(0, 3).map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 12 }}>🔴</span>
                    <span style={{ fontSize: 13, color: COLORS.text }}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── NOTES ── */}
          {view === "notes" && <NotesView />}
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <TaskModal task={editTask}
          onSave={editTask ? updateTask : addTask}
          onClose={() => { setModal(null); setEditTask(null); }} />
      )}

      {/* Notification Toast */}
      {notification && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: COLORS.card,
          border: `1px solid ${notification.color}44`, borderLeft: `3px solid ${notification.color}`,
          borderRadius: 12, padding: "12px 18px", fontSize: 13, color: COLORS.text,
          boxShadow: `0 4px 30px ${notification.color}33`, zIndex: 2000, animation: "fadeIn 0.3s ease",
          maxWidth: 320 }}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}

// ─── Notes View ───────────────────────────────────────────────────────────────
function NotesView() {
  const DEFAULTS = [
    { id: 1, title: "DSA Roadmap", content: "Arrays → Linked Lists → Stacks → Queues → Trees → Graphs → DP\n\nDaily: 2 problems minimum. Weekly: 1 hard problem.", color: COLORS.accentSoft },
    { id: 2, title: "LeetCode Tips", content: "• Always clarify edge cases\n• Think brute force first, then optimize\n• Time/Space complexity matters\n• Practice pattern recognition", color: COLORS.greenSoft },
  ];
  const [notes, setNotes] = useState(DEFAULTS);
  const [active, setActive] = useState(1);
  const [editing, setEditing] = useState(false);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  const current = notes.find(n => n.id === active);
  return (
    <div className="notes-view-grid">
      <div className={`notes-list-container ${mobileShowEditor ? "mobile-hide" : ""}`}>
        <button onClick={() => { const id = Date.now(); setNotes(n => [...n, { id, title: "New Note", content: "", color: COLORS.amberSoft }]); setActive(id); setEditing(true); setMobileShowEditor(true); }}
          style={{ width: "100%", padding: "9px", borderRadius: 10, border: `1px dashed ${COLORS.border}`,
            background: "transparent", color: COLORS.muted, cursor: "pointer", fontSize: 13, marginBottom: 10 }}>
          + New Note
        </button>
        {notes.map(n => (
          <div key={n.id} onClick={() => { setActive(n.id); setEditing(false); setMobileShowEditor(true); }}
            style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 6,
              background: active === n.id ? COLORS.card : "transparent",
              border: `1px solid ${active === n.id ? COLORS.border : "transparent"}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: active === n.id ? COLORS.text : COLORS.muted }}>{n.title}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {n.content.slice(0, 40) || "Empty note"}
            </div>
          </div>
        ))}
      </div>
      {current && (
        <div className={`note-editor-container ${!mobileShowEditor ? "mobile-hide" : ""}`} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <button className="note-back-button" onClick={() => setMobileShowEditor(false)}
              style={{ display: "none", background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 10px", color: COLORS.text, cursor: "pointer", marginRight: 4 }}>
              ←
            </button>
            <input value={current.title} onChange={e => setNotes(n => n.map(x => x.id === active ? { ...x, title: e.target.value } : x))}
              style={{ flex: 1, background: "transparent", border: "none", fontSize: 18, fontWeight: 700, color: COLORS.text, outline: "none", minWidth: 0 }} />
            <button onClick={() => setEditing(e => !e)}
              style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                background: editing ? COLORS.accentSoft : "transparent", color: editing ? COLORS.accent : COLORS.muted, cursor: "pointer", fontSize: 12 }}>
              {editing ? "✓ Done" : "✏ Edit"}
            </button>
            <button onClick={() => { setNotes(n => n.filter(x => x.id !== active)); setActive(notes[0]?.id); setMobileShowEditor(false); }}
              style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: COLORS.redSoft, color: COLORS.red, cursor: "pointer", fontSize: 12 }}>🗑</button>
          </div>
          {editing
            ? <textarea value={current.content} onChange={e => setNotes(n => n.map(x => x.id === active ? { ...x, content: e.target.value } : x))}
                style={{ width: "100%", minHeight: 320, background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                  borderRadius: 10, padding: 14, color: COLORS.text, fontSize: 14, lineHeight: 1.7, outline: "none", resize: "vertical", fontFamily: "'Space Mono', monospace" }} />
            : <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'Space Mono', monospace" }}>
                {current.content || <span style={{ color: COLORS.muted }}>Empty note. Click Edit to start writing...</span>}
              </div>
          }
        </div>
      )}
    </div>
  );
}