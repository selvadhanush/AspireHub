import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Cpu, 
  Upload, 
  Send, 
  MessageSquare, 
  FileText, 
  User, 
  Bot,
  Loader2,
  ChevronRight,
  Terminal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import './App.css';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

function Mermaid({ chart }) {
  const ref = useRef(null);

  // Simple sanitizer to fix common AI Mermaid syntax errors
  const sanitizeChart = (text) => {
    return text
      .replace(/\[(.*?)\]/g, (match, content) => {
        // Ensure labels with spaces or special chars are quoted
        if (content.includes(' ') || /[^a-zA-Z0-9]/.test(content)) {
          return `["${content.replace(/"/g, '')}"]`;
        }
        return match;
      });
  };

  useEffect(() => {
    if (ref.current && chart) {
      try {
        const sanitized = sanitizeChart(chart);
        ref.current.innerHTML = sanitized;
        ref.current.removeAttribute('data-processed');
        mermaid.contentLoaded();
      } catch (err) {
        console.error("Mermaid render error:", err);
      }
    }
  }, [chart]);

  return (
    <div className="mermaid-wrapper">
      <div key={chart} className="mermaid" ref={ref}>
        {chart}
      </div>
    </div>
  );
}

const API_BASE = 'http://127.0.0.1:8000';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo">
        <Cpu size={28} />
        <span>AspireHub</span>
      </div>
      
      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Learning</span>
        </NavLink>
        <NavLink to="/copilot" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Cpu size={20} />
          <span>System Copilot</span>
        </NavLink>
        <NavLink to="/interview" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Terminal size={20} />
          <span>Mock Interview</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <div className="nav-item">
          <User size={20} />
          <span>Dhanush</span>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isAI = msg.sender === 'ai' || msg.role === 'assistant';
  const text = msg.text || msg.content;
  return (
    <div className={`message ${isAI ? 'ai' : 'user'}`}>
      <div className="avatar">
        {isAI ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div className="bubble">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}

function LearningPage() {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chat, loading]);

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadStatus(res.ok ? `✅ ${selectedFile.name} ready` : `❌ ${data.detail}`);
    } catch (err) {
      setUploadStatus('❌ Connection failed');
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = { sender: 'user', text: query };
    setChat(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.text }),
      });
      const data = await res.json();
      setChat(prev => [...prev, { sender: 'ai', text: res.ok ? data.response : `Error: ${data.detail}` }]);
    } catch (err) {
      setChat(prev => [...prev, { sender: 'ai', text: 'Failed to connect to server.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Learning Hub</h2>
        <p style={{ color: 'var(--text-muted)' }}>Context-aware learning powered by your documents.</p>
      </header>

      <div className="upload-zone" onClick={() => document.getElementById('fileInput').click()}>
        <input 
          id="fileInput"
          type="file" 
          accept=".pdf" 
          onChange={handleUpload} 
          hidden
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={32} color="var(--primary)" />
          <span style={{ fontWeight: 500 }}>{file ? file.name : "Drop your PDF here or click to browse"}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{uploadStatus || "PDF documents up to 10MB"}</span>
        </div>
      </div>

      <div className="chat-container card">
        <div className="messages-list">
          {chat.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No conversation yet. Upload a document to start learning!</p>
            </div>
          )}
          {chat.map((msg, idx) => <ChatMessage key={idx} msg={msg} />)}
          {loading && (
            <div className="message ai">
              <div className="avatar"><Bot size={20} /></div>
              <div className="bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing context...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleAsk} className="input-wrapper">
          <input 
            className="input-box"
            placeholder="Ask anything about your document..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={loading || !query.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function CopilotPage() {
  const [prompt, setPrompt] = useState('');
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setDesign(null);

    try {
      const res = await fetch(`${API_BASE}/copilot/design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok) setDesign(data.response);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>System Copilot</h2>
        <p style={{ color: 'var(--text-muted)' }}>Architect complex systems with AI-driven structured design.</p>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleGenerate} className="input-wrapper" style={{ marginTop: 0 }}>
          <input 
            className="input-box"
            placeholder="What system would you like to design? (e.g. 'Scalable Video Platform')" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={loading || !prompt.trim()}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <p style={{ fontWeight: 500 }}>Generating Architectural Blueprint...</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Structuring requirements, components, and scaling strategies.</p>
        </div>
      )}

      {design && (
        <div className="design-output">
          <ReactMarkdown
            components={{
              h3: ({node, ...props}) => (
                <div className="design-section">
                  <h3 {...props} />
                </div>
              ),
              p: ({node, ...props}) => <p style={{ lineHeight: '1.7', color: '#cbd5e1', marginBottom: '1.2rem' }} {...props} />,
              strong: ({node, ...props}) => <span style={{ color: 'var(--primary)', fontWeight: 600 }} {...props} />,
              li: ({node, ...props}) => <li style={{ marginBottom: '0.6rem', color: '#cbd5e1' }} {...props} />,
              code: ({node, inline, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '');
                if (!inline && match && match[1] === 'mermaid') {
                  return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                }
                return (
                  <code className={className} style={{ 
                    background: '#1e293b', 
                    padding: '0.2rem 0.5rem', 
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#38bdf8'
                  }} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({node, ...props}) => (
                <div style={{ margin: '1.5rem 0' }}>
                  <pre style={{ 
                    background: '#020617', 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border)',
                    overflowX: 'auto',
                  }} {...props} />
                </div>
              )
            }}
          >
            {design}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}



function InterviewPage() {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  // Start the interview if chat is empty
  useEffect(() => {
    if (chat.length === 0) {
      handleInterview([]);
    }
  }, []);

  const handleInterview = async (history) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/copilot/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (res.ok) {
        setChat(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newChat = [...chat, { role: 'user', content: input }];
    setChat(newChat);
    setInput('');
    handleInterview(newChat);
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>System Interview</h2>
        <p style={{ color: 'var(--text-muted)' }}>Practice FAANG-style system design interviews with real-time feedback.</p>
      </header>

      <div className="chat-container card">
        <div className="messages-list">
          {chat.map((msg, idx) => <ChatMessage key={idx} msg={msg} />)}
          {loading && (
            <div className="message ai">
              <div className="avatar"><Bot size={20} /></div>
              <div className="bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Interviewer is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="input-wrapper">
          <input 
            className="input-box"
            placeholder="Talk to the interviewer..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LearningPage />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/interview" element={<InterviewPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;


