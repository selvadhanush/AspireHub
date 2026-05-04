import { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file first.');
      return;
    }
    setUploadStatus('Uploading and processing...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus('✅ ' + data.message);
      } else {
        setUploadStatus('❌ Error: ' + data.detail);
      }
    } catch (err) {
      setUploadStatus('❌ Failed to connect to server.');
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setChat((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.text }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setChat((prev) => [...prev, { sender: 'ai', text: data.response }]);
      } else {
        setChat((prev) => [...prev, { sender: 'ai', text: 'Error: ' + data.detail }]);
      }
    } catch (err) {
      setChat((prev) => [...prev, { sender: 'ai', text: 'Failed to connect to server.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <header>
        <h1>📄 Chat with PDF</h1>
        <p>Upload a document and ask questions about it.</p>
      </header>

      <div className="upload-section card">
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload PDF</button>
        {uploadStatus && <p className="status">{uploadStatus}</p>}
      </div>

      <div className="chat-section card">
        <div className="chat-window">
          {chat.length === 0 && <p className="empty-chat">No messages yet. Ask a question!</p>}
          {chat.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              <div className="bubble">{msg.text}</div>
            </div>
          ))}
          {loading && (
            <div className="message ai">
              <div className="bubble typing">Thinking...</div>
            </div>
          )}
        </div>

        <form onSubmit={handleAsk} className="input-form">
          <input 
            type="text" 
            placeholder="Ask a question about your PDF..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
