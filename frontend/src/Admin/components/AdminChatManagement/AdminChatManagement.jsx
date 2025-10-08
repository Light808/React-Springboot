import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Bot, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import './AdminChatManagement.css';

const AdminChatManagement = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, replied
  const [searchTerm, setSearchTerm] = useState('');

  // Load messages from localStorage
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    const storedMessages = localStorage.getItem('admin_chat_messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  };

  const saveMessages = (newMessages) => {
    localStorage.setItem('admin_chat_messages', JSON.stringify(newMessages));
    setMessages(newMessages);
  };

  const handleReply = () => {
    if (!selectedMessage || !replyText.trim()) return;

    const updatedMessages = messages.map(msg => {
      if (msg.id === selectedMessage.id) {
        return {
          ...msg,
          adminReply: replyText,
          status: 'replied',
          repliedAt: new Date().toISOString()
        };
      }
      return msg;
    });

    saveMessages(updatedMessages);
    setReplyText('');
    setSelectedMessage(null);
  };

  const markAsRead = (messageId) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, isRead: true };
      }
      return msg;
    });
    saveMessages(updatedMessages);
  };

  const deleteMessage = (messageId) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    saveMessages(updatedMessages);
    if (selectedMessage && selectedMessage.id === messageId) {
      setSelectedMessage(null);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && msg.status === 'pending') ||
                         (filter === 'replied' && msg.status === 'replied');
    
    const matchesSearch = msg.userMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (msg.adminReply && msg.adminReply.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const pendingCount = messages.filter(msg => msg.status === 'pending').length;

  return (
    <div className="admin-chat-container">
      <div className="admin-chat-header">
        <h2>
          <MessageCircle className="icon" />
          Quản lý Chat
          {pendingCount > 0 && (
            <span className="pending-badge">{pendingCount}</span>
          )}
        </h2>
        
        <div className="admin-chat-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Tất cả ({messages.length})
            </button>
            <button 
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Chờ trả lời ({pendingCount})
            </button>
            <button 
              className={filter === 'replied' ? 'active' : ''}
              onClick={() => setFilter('replied')}
            >
              Đã trả lời ({messages.filter(m => m.status === 'replied').length})
            </button>
          </div>
        </div>
      </div>

      <div className="admin-chat-content">
        <div className="messages-list">
          {filteredMessages.length === 0 ? (
            <div className="no-messages">
              <MessageCircle className="icon" />
              <p>Không có tin nhắn nào</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div 
                key={message.id}
                className={`message-item ${selectedMessage?.id === message.id ? 'selected' : ''} ${!message.isRead ? 'unread' : ''}`}
                onClick={() => {
                  setSelectedMessage(message);
                  markAsRead(message.id);
                }}
              >
                <div className="message-header">
                  <div className="user-info">
                    <User className="icon" />
                    <span className="username">{message.username || 'Khách'}</span>
                    <span className="timestamp">
                      {new Date(message.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="message-status">
                    {message.status === 'pending' && <AlertCircle className="pending-icon" />}
                    {message.status === 'replied' && <CheckCircle className="replied-icon" />}
                  </div>
                </div>
                
                <div className="message-preview">
                  {message.userMessage.length > 100 
                    ? `${message.userMessage.substring(0, 100)}...` 
                    : message.userMessage
                  }
                </div>
                
                {message.adminReply && (
                  <div className="admin-reply-preview">
                    <Bot className="icon" />
                    <span>Admin: {message.adminReply.substring(0, 50)}...</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {selectedMessage && (
          <div className="message-detail">
            <div className="message-detail-header">
              <div className="user-info">
                <User className="icon" />
                <div>
                  <span className="username">{selectedMessage.username || 'Khách'}</span>
                  <span className="timestamp">
                    {new Date(selectedMessage.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
              <button 
                className="delete-btn"
                onClick={() => deleteMessage(selectedMessage.id)}
              >
                Xóa
              </button>
            </div>

            <div className="message-content">
              <div className="user-message">
                <User className="icon" />
                <div className="message-text">
                  {selectedMessage.userMessage}
                </div>
              </div>

              {selectedMessage.adminReply ? (
                <div className="admin-message">
                  <Bot className="icon" />
                  <div className="message-text">
                    {selectedMessage.adminReply}
                    <div className="reply-timestamp">
                      Trả lời lúc: {new Date(selectedMessage.repliedAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="reply-section">
                  <div className="reply-input">
                    <textarea
                      placeholder="Nhập câu trả lời..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows="4"
                    />
                  </div>
                  <button 
                    className="reply-btn"
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                  >
                    <Send className="icon" />
                    Gửi trả lời
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatManagement;
