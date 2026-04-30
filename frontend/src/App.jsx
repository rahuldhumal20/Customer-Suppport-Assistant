import { useState, useRef, useEffect } from "react";

const BOT_AVATAR = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect width="20" height="20" rx="10" fill="#1d9e75" />
    <rect x="5" y="7" width="3" height="3" rx="1" fill="white" />
    <rect x="12" y="7" width="3" height="3" rx="1" fill="white" />
    <rect x="6" y="13" width="8" height="1.5" rx="0.75" fill="white" />
    <rect x="8" y="3" width="1.5" height="3" rx="0.5" fill="white" />
    <rect x="10.5" y="3" width="1.5" height="3" rx="0.5" fill="white" />
  </svg>
);

const INITIAL_MSG = {
  id: 0,
  sender: "bot",
  text: "Hello! I'm your AI support assistant. I can help you with orders, refunds, account issues, and payments. How can I help you today?",
  time: new Date(),
};

const SUGGESTED = [
  "What is your refund policy?",
  "How do I track my order?",
  "How do I reset my password?",
  "My payment was charged but no order placed.",
];

// Colour pill for confidence score
function ConfidencePill({ score, dark }) {
  if (score == null) return null;
  // ChromaDB L2 distance: lower = better. Convert to 0-100% display.
  const pct = Math.max(0, Math.min(100, Math.round((1 - score / 2) * 100)));
  const good = pct >= 60;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, padding: "2px 8px", borderRadius: 20,
      background: good
        ? dark ? "rgba(29,158,117,0.15)" : "rgba(29,158,117,0.10)"
        : dark ? "rgba(200,120,0,0.15)" : "rgba(200,120,0,0.10)",
      color: good ? "#1d9e75" : "#b86000",
      fontWeight: 600,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: good ? "#1d9e75" : "#e08020",
        display: "inline-block",
      }} />
      {pct}% confidence
    </span>
  );
}

export default function App() {
  const [theme, setTheme] = useState("light");
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const dark = theme === "dark";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── sendMessage ────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const query = (text || input).trim();
    if (!query || loading) return;
    setInput("");

    const userMsg = { id: Date.now(), sender: "user", text: query, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      const responseText = data.answer || data.response || "Sorry, I couldn't process that.";
      const isHITL = responseText.toLowerCase().includes("escalat");

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: responseText,
          time: new Date(),
          hitl: isHITL,
          confidence: data.confidence ?? null,  // optional field from backend
          source: data.source ?? null,          // optional field from backend
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Connection error. Please make sure the server is running at http://127.0.0.1:8000",
          time: new Date(),
          error: true,
        },
      ]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  // ── resetChat ──────────────────────────────────────────────────────────────
  const resetChat = async () => {
    try {
      await fetch("http://127.0.0.1:8000/reset", { method: "POST" });
    } catch {
      // /reset is optional — UI resets regardless
    }
    setMessages([{ ...INITIAL_MSG, id: Date.now(), time: new Date() }]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fmt = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── styles ─────────────────────────────────────────────────────────────────
  const css = {
    wrap: {
      minHeight: "100vh",
      background: dark ? "#0f1117" : "#f4f2ee",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      transition: "background 0.3s",
    },
    shell: {
      width: "100%", maxWidth: 720, height: "88vh", maxHeight: 820,
      display: "flex", flexDirection: "column",
      background: dark ? "#1a1d27" : "#ffffff",
      borderRadius: 20,
      border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
      overflow: "hidden",
      boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.6)" : "0 24px 80px rgba(0,0,0,0.10)",
    },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 22px",
      borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
      background: dark ? "#1a1d27" : "#ffffff",
    },
    headerLeft:    { display: "flex", alignItems: "center", gap: 12 },
    headerActions: { display: "flex", alignItems: "center", gap: 8 },
    avatarWrap: {
      width: 40, height: 40, borderRadius: 12,
      background: dark ? "#0f3d2e" : "#e1f5ee",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: 15, fontWeight: 600, color: dark ? "#f0f0f0" : "#141414", margin: 0 },
    headerSub:   { fontSize: 12, color: dark ? "#6b7a8d" : "#8a9aaa", margin: "2px 0 0" },
    onlineDot: {
      display: "inline-block", width: 6, height: 6, borderRadius: "50%",
      background: "#1d9e75", marginRight: 5,
    },
    iconBtn: {
      height: 36, borderRadius: 10,
      border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
      background: "transparent", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      color: dark ? "#a0aab8" : "#6b7a8d",
      fontSize: 13, fontWeight: 500, padding: "0 10px",
      transition: "background 0.2s, color 0.2s",
      fontFamily: "inherit",
    },
    messages: {
      flex: 1, overflowY: "auto",
      padding: "20px 22px 8px",
      display: "flex", flexDirection: "column", gap: 16,
      scrollbarWidth: "thin",
      scrollbarColor: dark ? "#2d3040 transparent" : "#dde0e6 transparent",
    },
    userRow: { display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 8 },
    botRow:  { display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 10 },
    userBubble: {
      maxWidth: "72%",
      background: "#1d9e75", color: "#fff",
      padding: "10px 15px",
      borderRadius: "18px 18px 4px 18px",
      fontSize: 14, lineHeight: 1.55, wordBreak: "break-word",
    },
    botBubble: (hitl, error) => ({
      maxWidth: "72%",
      background: hitl  ? dark ? "#2a2010" : "#fef9ec"
                : error ? dark ? "#2a1010" : "#fef0f0"
                        : dark ? "#252836" : "#f3f4f6",
      color: dark ? "#e8eaf0" : "#1a1d27",
      padding: "10px 15px",
      borderRadius: "18px 18px 18px 4px",
      fontSize: 14, lineHeight: 1.55, wordBreak: "break-word",
      border: hitl  ? `1px solid ${dark ? "#5a4010" : "#f0d080"}`
            : error ? `1px solid ${dark ? "#5a1010" : "#f0a0a0"}`
            : "none",
    }),
    metaRow: {
      display: "flex", alignItems: "center", gap: 8,
      flexWrap: "wrap", marginTop: 5,
    },
    sourceTag: {
      fontSize: 11, padding: "2px 8px", borderRadius: 20,
      background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      color: dark ? "#6b7a8d" : "#8a9aaa",
    },
    timeStamp: {
      fontSize: 11, color: dark ? "#4a5568" : "#b0bbc8",
      margin: "3px 4px 0", alignSelf: "flex-end",
    },
    botAvatar: {
      width: 30, height: 30, borderRadius: 10,
      background: dark ? "#0f3d2e" : "#e1f5ee",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    typing: {
      display: "flex", gap: 5, padding: "12px 15px",
      borderRadius: "18px 18px 18px 4px",
      background: dark ? "#252836" : "#f3f4f6",
      width: "fit-content",
    },
    dot: (i) => ({
      width: 7, height: 7, borderRadius: "50%", background: "#1d9e75",
      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
    }),
    suggested: {
      padding: "10px 22px 14px", display: "flex", gap: 8, flexWrap: "wrap",
      borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
    },
    chip: {
      fontSize: 12, padding: "6px 12px", borderRadius: 20,
      border: `1px solid ${dark ? "rgba(29,158,117,0.3)" : "rgba(29,158,117,0.3)"}`,
      background: dark ? "rgba(29,158,117,0.08)" : "rgba(29,158,117,0.06)",
      color: dark ? "#5dcaa5" : "#0f6e56",
      cursor: "pointer", transition: "background 0.15s", whiteSpace: "nowrap",
    },
    inputArea: {
      padding: "12px 16px 16px",
      borderTop: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
      display: "flex", gap: 10, alignItems: "flex-end",
    },
    textarea: {
      flex: 1,
      background: dark ? "#252836" : "#f3f4f6",
      border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
      borderRadius: 14, padding: "10px 14px",
      fontSize: 14, color: dark ? "#e8eaf0" : "#1a1d27",
      resize: "none", outline: "none", fontFamily: "inherit",
      lineHeight: 1.5, minHeight: 44, maxHeight: 120,
      transition: "border 0.2s",
    },
    sendBtn: (active) => ({
      width: 44, height: 44, borderRadius: 14,
      background: active ? "#1d9e75" : dark ? "#252836" : "#e8eaed",
      border: "none", cursor: active ? "pointer" : "default",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      transition: "background 0.2s, transform 0.1s",
    }),
    footer: { textAlign: "center", fontSize: 11, color: dark ? "#3a4050" : "#c8d0da", padding: "0 0 6px" },
    hitlBadge: {
      display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 8,
      background: dark ? "#3a2a00" : "#fef3cc", color: dark ? "#e0a020" : "#9a6500",
      marginBottom: 5,
    },
    errorBadge: {
      display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 8,
      background: dark ? "#3a0000" : "#fff0f0", color: dark ? "#e07070" : "#c00",
      marginBottom: 5,
    },
  };

  const showSuggested = messages.length === 1 && !loading;

  return (
    <div style={css.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        textarea::placeholder { color: ${dark ? "#4a5568" : "#b0bbc8"}; }
        textarea:focus { border-color: #1d9e75 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? "#2d3040" : "#dde0e6"}; border-radius: 4px; }
        .icon-btn:hover { background: ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} !important; }
      `}</style>

      <div style={css.shell}>

        {/* ── Header ── */}
        <div style={css.header}>
          <div style={css.headerLeft}>
            <div style={css.avatarWrap}>{BOT_AVATAR}</div>
            <div>
              <p style={css.headerTitle}>Support Assistant</p>
              <p style={css.headerSub}>
                <span style={css.onlineDot} />
                Online · RAG-powered
              </p>
            </div>
          </div>

          <div style={css.headerActions}>
            {/* New Chat button */}
            <button
              className="icon-btn"
              style={css.iconBtn}
              onClick={resetChat}
              title="Start a new chat and clear memory"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 1.5L12.5 4.5L5 12H2V9L9.5 1.5Z"
                  stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
              </svg>
              New Chat
            </button>

            {/* Theme toggle */}
            <button
              className="icon-btn"
              style={{ ...css.iconBtn, width: 36, padding: 0, fontSize: 16 }}
              onClick={() => setTheme(dark ? "light" : "dark")}
              title="Toggle dark / light mode"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={css.messages}>
          {messages.map((msg) =>
            msg.sender === "user" ? (
              <div key={msg.id} style={css.userRow}>
                <span style={css.timeStamp}>{fmt(msg.time)}</span>
                <div style={css.userBubble}>{msg.text}</div>
              </div>
            ) : (
              <div key={msg.id} style={css.botRow}>
                <div style={css.botAvatar}>{BOT_AVATAR}</div>
                <div>
                  {msg.hitl  && <div style={css.hitlBadge}>⚠ Escalated to human</div>}
                  {msg.error && <div style={css.errorBadge}>⚡ Connection error</div>}

                  <div style={css.botBubble(msg.hitl, msg.error)}>
                    {msg.text}
                  </div>

                  {/* Confidence pill + source tag — only shown if backend sends them */}
                  {(msg.confidence != null || msg.source) && (
                    <div style={css.metaRow}>
                      <ConfidencePill score={msg.confidence} dark={dark} />
                      {msg.source && (
                        <span style={css.sourceTag}>📄 {msg.source}</span>
                      )}
                    </div>
                  )}

                  <div style={{ ...css.timeStamp, marginLeft: 0 }}>{fmt(msg.time)}</div>
                </div>
              </div>
            )
          )}

          {/* Typing indicator */}
          {loading && (
            <div style={css.botRow}>
              <div style={css.botAvatar}>{BOT_AVATAR}</div>
              <div style={css.typing}>
                <span style={css.dot(0)} />
                <span style={css.dot(1)} />
                <span style={css.dot(2)} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Suggested chips (first load only) ── */}
        {showSuggested && (
          <div style={css.suggested}>
            {SUGGESTED.map((s) => (
              <button
                key={s}
                style={css.chip}
                onClick={() => sendMessage(s)}
                onMouseEnter={(e) =>
                  (e.target.style.background = dark ? "rgba(29,158,117,0.15)" : "rgba(29,158,117,0.12)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = dark ? "rgba(29,158,117,0.08)" : "rgba(29,158,117,0.06)")
                }
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input area ── */}
        <div style={css.inputArea}>
          <textarea
            ref={inputRef}
            style={css.textarea}
            value={input}
            rows={1}
            placeholder="Ask about orders, refunds, accounts…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            style={css.sendBtn(!!(input.trim() && !loading))}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            onMouseEnter={(e) => {
              if (input.trim() && !loading) e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 9L16 2L10 9L16 16L2 9Z"
                fill={input.trim() && !loading ? "white" : dark ? "#3a4050" : "#b0bbc8"}
              />
            </svg>
          </button>
        </div>

        <div style={css.footer}>Powered by RAG · LangGraph · Groq · ChromaDB</div>
      </div>
    </div>
  );
}

