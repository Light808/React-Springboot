import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getChatMessages, updateChatMessage, deleteChatMessage } from '../../../services/aiService';
import './AdminChatWidget.css';

const AdminChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Load messages from localStorage
  useEffect(() => {
    loadMessages();
    // Refresh messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = () => {
    const storedMessages = getChatMessages();
    setMessages(storedMessages);
  };

  const handleReply = () => {
    if (!selectedMessage || !replyText.trim()) return;

    const success = updateChatMessage(selectedMessage.id, {
      adminReply: replyText,
      status: 'replied',
      repliedAt: new Date().toISOString()
    });

    if (success) {
      loadMessages();
      setReplyText('');
      setSelectedMessage(null);
    }
  };

  const markAsRead = (messageId) => {
    const success = updateChatMessage(messageId, { isRead: true });
    if (success) {
      loadMessages();
    }
  };

  const deleteMessage = (messageId) => {
    const success = deleteChatMessage(messageId);
    if (success) {
      loadMessages();
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage(null);
      }
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
  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <>
      {/* Chat Widget Toggle Button */}
      <div className={`admin-chat-widget-toggle ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <MessageCircle className="icon" />
        {pendingCount > 0 && <span className="pending-badge">{pendingCount}</span>}
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </div>

      {/* Chat Widget Panel */}
      {isOpen && (
        <div className="admin-chat-widget-panel">
          <div className="admin-chat-widget-header">
            <div className="header-left">
              <h3>
                <MessageCircle className="icon" />
                Admin Chat
                {pendingCount > 0 && <span className="pending-count">{pendingCount}</span>}
              </h3>
            </div>
            <div className="header-right">
              <button 
                className="expand-btn"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="admin-chat-widget-content">
              {/* Filter and Search */}
              <div className="widget-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="filter-buttons">
                  <button 
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                  >
                    Tất cả
                  </button>
                  <button 
                    className={filter === 'pending' ? 'active' : ''}
                    onClick={() => setFilter('pending')}
                  >
                    Chờ ({pendingCount})
                  </button>
                  <button 
                    className={filter === 'replied' ? 'active' : ''}
                    onClick={() => setFilter('replied')}
                  >
                    Đã trả lời
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="widget-messages-list">
                {filteredMessages.length === 0 ? (
                  <div className="no-messages">
                    <MessageCircle className="icon" />
                    <p>Không có tin nhắn</p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div 
                      key={message.id}
                      className={`widget-message-item ${selectedMessage?.id === message.id ? 'selected' : ''} ${!message.isRead ? 'unread' : ''}`}
                      onClick={() => {
                        setSelectedMessage(message);
                        markAsRead(message.id);
                      }}
                    >
                      <div className="message-header">
                        <div className="user-info">
                          <User className="icon" />
                          <span className="username">{message.username || 'Khách'}</span>
                        </div>
                        <div className="message-status">
                          {message.status === 'pending' && <AlertCircle className="pending-icon" />}
                          {message.status === 'replied' && <CheckCircle className="replied-icon" />}
                        </div>
                      </div>
                      
                      <div className="message-preview">
                        {message.userMessage.length > 50 
                          ? `${message.userMessage.substring(0, 50)}...` 
                          : message.userMessage
                        }
                      </div>
                      
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Detail */}
              {selectedMessage && (
                <div className="widget-message-detail">
                  <div className="detail-header">
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
                            Trả lời: {new Date(selectedMessage.repliedAt).toLocaleString('vi-VN')}
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
                            rows="3"
                          />
                        </div>
                        <button 
                          className="reply-btn"
                          onClick={handleReply}
                          disabled={!replyText.trim()}
                        >
                          <Send className="icon" />
                          Gửi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AdminChatWidget;
