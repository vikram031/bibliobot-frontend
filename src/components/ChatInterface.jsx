import React, { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

const BACKEND_URL = 'https://bibliobot.onrender.com'; // Change to your IP for network access

const QUICK_ACTIONS = [
  { label: '📚 Search a book', message: 'find ' },
  { label: '✅ Check availability', message: 'is available' },
  { label: '💡 Recommend me a book', message: 'recommend me a book' },
  { label: '🕐 Library hours', message: 'what are the library hours' },
];

const SAMPLE_BOOKS = [
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', genre: 'Algorithms', available: true },
  { title: 'Clean Code', author: 'Robert C. Martin', genre: 'Software Engineering', available: false },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', genre: 'Software Engineering', available: true },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm BiblioBot 📚, your JECRC University Library Assistant. I can help you search books, check availability, and get recommendations!", isBot: true },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'browse' | 'admin'
  const [searchQuery, setSearchQuery] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [stats, setStats] = useState({ totalBooks: 3, available: 2, issued: 1, users: 0 });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let session = localStorage.getItem('bibliobot_session');
    if (!session) {
      session = 'session_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('bibliobot_session', session);
    }
    setSessionId(session);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e, overrideText) => {
    if (e) e.preventDefault();
    const text = overrideText ?? input;
    if (!text.trim()) return;

    const userMessage = { text, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const data = await response.json();
      setIsTyping(false);
      setMessages(prev => [...prev, { text: data.reply, isBot: true }]);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: '⚠️ Unable to reach the server. Please make sure the backend is running.', isBot: true }]);
    }
  };

  const handleQuickAction = (action) => {
    if (action.message.endsWith(' ')) {
      setInput(action.message);
      setActiveTab('chat');
      document.getElementById('chat-input')?.focus();
    } else {
      setActiveTab('chat');
      handleSendMessage(null, action.message);
    }
  };

  const filteredBooks = SAMPLE_BOOKS.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">📚</span>
          <div>
            <h1>BiblioBot</h1>
            <p>JECRC Library</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={activeTab === 'chat' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('chat')}>
            <span>💬</span> Chat Assistant
          </button>
          <button className={activeTab === 'browse' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('browse')}>
            <span>🔍</span> Browse Books
          </button>
          <button className={activeTab === 'admin' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('admin')}>
            <span>⚙️</span> Admin Panel
          </button>
        </nav>

        <div className="quick-actions">
          <p className="section-label">Quick Actions</p>
          {QUICK_ACTIONS.map((a, i) => (
            <button key={i} className="quick-btn" onClick={() => handleQuickAction(a)}>
              {a.label}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="status-dot"></div>
          <span>Backend connected</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="chat-panel">
            <div className="chat-header">
              <div>
                <h2>Chat with BiblioBot</h2>
                <p>Ask about books, availability, or library guidelines</p>
              </div>
              <button className="clear-btn" onClick={() => setMessages([{ text: "Hello! I'm BiblioBot 📚. How can I help you today?", isBot: true }])}>
                Clear chat
              </button>
            </div>

            <div className="messages-area">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.isBot ? 'bot' : 'user'}`}>
                  {msg.isBot && <div className="avatar">🤖</div>}
                  <div className={`bubble ${msg.isBot ? 'bot-bubble' : 'user-bubble'}`}>
                    {msg.text.split('\n').map((line, j) => <p key={j}>{line}</p>)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message-row bot">
                  <div className="avatar">🤖</div>
                  <div className="bubble bot-bubble typing-bubble">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="input-area" onSubmit={handleSendMessage}>
              <input
                id="chat-input"
                type="text"
                placeholder="Ask about books, availability, or guidelines..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!input.trim()}>
                Send ➤
              </button>
            </form>
          </div>
        )}

        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          <div className="browse-panel">
            <div className="panel-header">
              <h2>📖 Browse Book Catalog</h2>
              <p>Search through available books in the JECRC library</p>
            </div>

            <input
              className="search-input"
              type="text"
              placeholder="Search by title, author, or genre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-num">{SAMPLE_BOOKS.length}</span>
                <span className="stat-label">Total Books</span>
              </div>
              <div className="stat-card green">
                <span className="stat-num">{SAMPLE_BOOKS.filter(b => b.available).length}</span>
                <span className="stat-label">Available</span>
              </div>
              <div className="stat-card red">
                <span className="stat-num">{SAMPLE_BOOKS.filter(b => !b.available).length}</span>
                <span className="stat-label">Issued</span>
              </div>
            </div>

            <div className="books-grid">
              {filteredBooks.length === 0 ? (
                <p className="no-results">No books found matching "{searchQuery}"</p>
              ) : filteredBooks.map((book, i) => (
                <div key={i} className="book-card">
                  <div className="book-cover">
                    {book.title.charAt(0)}
                  </div>
                  <div className="book-info">
                    <h3>{book.title}</h3>
                    <p className="book-author">by {book.author}</p>
                    <span className="book-genre">{book.genre}</span>
                    <div className="book-footer">
                      <span className={`availability ${book.available ? 'available' : 'issued'}`}>
                        {book.available ? '✅ Available' : '❌ Issued'}
                      </span>
                      <button className="ask-btn" onClick={() => {
                        setActiveTab('chat');
                        handleSendMessage(null, `is ${book.title} available`);
                      }}>
                        Ask Bot →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && (
          <div className="admin-panel">
            <div className="panel-header">
              <h2>⚙️ Admin Panel</h2>
              <p>Manage books and view library statistics</p>
            </div>

            {!adminLoggedIn ? (
              <div className="admin-login">
                <div className="login-card">
                  <h3>🔐 Admin Login</h3>
                  <p>Enter the admin password to continue</p>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adminPassword === 'admin123' && setAdminLoggedIn(true)}
                  />
                  <button
                    className="login-btn"
                    onClick={() => {
                      if (adminPassword === 'admin123') setAdminLoggedIn(true);
                      else alert('Wrong password! (hint: admin123)');
                    }}
                  >
                    Login
                  </button>
                  <p className="hint">Demo password: admin123</p>
                </div>
              </div>
            ) : (
              <div className="admin-dashboard">
                <div className="admin-stats">
                  {[
                    { label: 'Total Books', value: SAMPLE_BOOKS.length, color: 'blue' },
                    { label: 'Available', value: SAMPLE_BOOKS.filter(b => b.available).length, color: 'green' },
                    { label: 'Issued', value: SAMPLE_BOOKS.filter(b => !b.available).length, color: 'red' },
                    { label: 'Active Sessions', value: 1, color: 'purple' },
                  ].map((s, i) => (
                    <div key={i} className={`admin-stat-card ${s.color}`}>
                      <span className="big-num">{s.value}</span>
                      <span className="stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="admin-table-section">
                  <h3>📋 Book Inventory</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Genre</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_BOOKS.map((book, i) => (
                        <tr key={i}>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td><span className="genre-tag">{book.genre}</span></td>
                          <td>
                            <span className={`status-badge ${book.available ? 'available' : 'issued'}`}>
                              {book.available ? 'Available' : 'Issued'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button className="logout-btn" onClick={() => { setAdminLoggedIn(false); setAdminPassword(''); }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}