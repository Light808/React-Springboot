import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { chatAI, getClientId, getChatMessages, markReplyDelivered } from '../../../services/aiService';
import './ChatBox.css';

const BASE_PROMPTS = [
  'Today Showtime',
  'Find a Theater Near Me',
  'Book Tickets for Any Movie Tonight',
  'Select Seats',
  'Popcorn and Drink Combo Deals',
  'Ticket Exchange/Refund Policy'
];

function getRoutePrompts(pathname) {
  if (pathname.startsWith('/movie/')) {
    return [
      "This movie's showtimes",
      'What viewers think of this movie',
      'Is this movie suitable for children?',
      'Book tickets for this movie in the evening'
    ];
  }
  if (pathname.startsWith('/cinema/')) {
    return [
      'Showtimes at this theater',
      'Directions to the theater',
      'What special screening rooms does this theater have?'
    ];
  }
  if (pathname.startsWith('/cinemas')) {
    return [
      'Suggestions for cinemas near me',
      'Are there any movie theaters with discounts?'
    ];
  }
  if (pathname.startsWith('/combo-selection')) {
    return [
      'Suggested combo savings', 
      'Which combo is suitable for 2 people?'
    ];
  }
  if (pathname.startsWith('/seat-selection')) {
    return [
      'Suggestions for choosing a good seat', 
      'Which seat is best for watching 3D?'
    ];
  }
  return [];
}

const ChatBox = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! How can I help you today? Do you need assistance booking tickets, viewing showtimes or combo information?' }
  ]);
  const [prompts, setPrompts] = useState(() => [...BASE_PROMPTS]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const clientIdRef = useRef(null);
  // keep track of admin replies appended to chat (no separate state needed)

  useEffect(() => {
    const routePrompts = getRoutePrompts(location.pathname);
    setPrompts([...routePrompts, ...BASE_PROMPTS]);
  }, [location.pathname]);

  // init client id and start polling for admin replies
  useEffect(() => {
    clientIdRef.current = getClientId();
    const poll = () => {
      try {
        const all = getChatMessages();
        const mine = all.filter(m => m.clientId === clientIdRef.current && m.adminReply && m.id);
        // Only pick those not delivered yet
        const delivered = new Set(getDeliveredReplyIdsSafe());
        const newOnes = mine.filter(m => !delivered.has(m.id));
        if (newOnes.length > 0) {
          const notices = newOnes.map(m => ({ id: m.id, text: m.adminReply }));
          // append to chat as assistant messages
          setMessages(prev => [...prev, ...notices.map(n => ({ role: 'assistant', content: `Admin: ${n.text}` }))]);
          notices.forEach(n => markReplyDelivered(n.id));
          scrollToBottom();
        }
      } catch {
        // ignore polling errors
      }
    };
    const interval = setInterval(poll, 3000);
    poll();
    return () => clearInterval(interval);
  }, []);

  function getDeliveredReplyIdsSafe() {
    try {
      const raw = localStorage.getItem('delivered_reply_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  const handleToggle = () => {
    setOpen(!open);
    setTimeout(scrollToBottom, 50);
  };

  const sendWithMessages = async (nextMessages) => {
    setLoading(true);
    try {
      const system = {
        role: 'system',
        content: `You are a cinema assistant. Current route: ${location.pathname}. If user asks about showtimes, booking, seats, combos, or policies, answer concretely with steps. If the question is about the currently viewed movie or cinema page, assume context refers to that item.`
      };
      const reply = await chatAI([system, ...nextMessages]);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      scrollToBottom();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    scrollToBottom();
    await sendWithMessages(next);
  };

  const handleQuickPrompt = async (prompt) => {
    if (loading) return;
    const next = [...messages, { role: 'user', content: prompt }];
    setMessages(next);
    scrollToBottom();
    await sendWithMessages(next);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbox-root">
      {!open && (
        <button className="chatbox-fab" onClick={handleToggle} title="Chat AI">
          <MessageCircle size={20} />
        </button>
      )}

      {open && (
        <div className="chatbox-container">
          <div className="chatbox-header">
            <span>Chat Assistant</span>
            <button className="chatbox-close" onClick={handleToggle}>
              <X size={16} />
            </button>
          </div>

          <div className="chatbox-messages" ref={listRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`msg ${m.role}`}>{m.content}</div>
            ))}
            {loading && <div className="msg assistant">Typing...</div>}
          </div>

          <div className="chatbox-suggestions">
            {prompts.map((p) => (
              <button key={p} className="chip" onClick={() => handleQuickPrompt(p)} disabled={loading}>
                {p}
              </button>
            ))}
          </div>

          <div className="chatbox-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your message..."
            />
            <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
