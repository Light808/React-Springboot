/* eslint-disable no-empty */
const API_BASE_URL = 'http://localhost:8080/api';

// ---- Storage keys ----
const STORAGE_KEYS = {
  MOCK_FLAG: 'ai_mock_enabled',
  CHAT_MESSAGES: 'admin_chat_messages',
  USER_SESSION: 'user_session',
  CLIENT_ID: 'chat_client_id',
  DELIVERED_REPLY_IDS: 'delivered_reply_ids'
};

// ---- Mock config helpers ----
export function setAIMockEnabled(enabled) {
  try { localStorage.setItem(STORAGE_KEYS.MOCK_FLAG, enabled ? 'true' : 'false'); } catch {}
}
export function getAIMockEnabled() {
  try { return localStorage.getItem(STORAGE_KEYS.MOCK_FLAG) === 'true'; } catch { return false; }
}

// ---- Client identity ----
export function getClientId() {
  try {
    let id = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    if (!id) {
      id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEYS.CLIENT_ID, id);
    }
    return id;
  } catch {
    return 'anonymous-client';
  }
}

// ---- Chat message management ----
export function saveChatMessage(userMessage, aiResponse, username = null) {
  try {
    const messages = getChatMessages();
    const newMessage = {
      id: Date.now().toString(),
      username: username || 'Khách',
      userMessage,
      aiResponse,
      timestamp: new Date().toISOString(),
      status: 'pending', 
      isRead: false,
      adminReply: null,
      repliedAt: null,
      clientId: getClientId()
    };
    
    messages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    return newMessage;
  } catch (error) {
    console.error('Error saving chat message:', error);
    return null;
  }
}

export function getChatMessages() {
  try {
    const messages = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error('Error loading chat messages:', error);
    return [];
  }
}

export function updateChatMessage(messageId, updates) {
  try {
    const messages = getChatMessages();
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(updatedMessages));
    return true;
  } catch (error) {
    console.error('Error updating chat message:', error);
    return false;
  }
}

export function deleteChatMessage(messageId) {
  try {
    const messages = getChatMessages();
    const filteredMessages = messages.filter(msg => msg.id !== messageId);
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(filteredMessages));
    return true;
  } catch (error) {
    console.error('Error deleting chat message:', error);
    return false;
  }
}

// ---- Delivery tracking for client to avoid duplicate admin replies ----
export function getDeliveredReplyIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELIVERED_REPLY_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markReplyDelivered(replyMessageId) {
  try {
    const ids = getDeliveredReplyIds();
    if (!ids.includes(replyMessageId)) {
      ids.push(replyMessageId);
      localStorage.setItem(STORAGE_KEYS.DELIVERED_REPLY_IDS, JSON.stringify(ids));
    }
  } catch {}
}

const MOCK_DATA = {
  showtimesToday: [
    { cinema: 'Galaxy Nguyễn Du', movie: 'Làm Giàu Với Ma 2', times: ['16:30', '18:45', '21:00'] },
    { cinema: 'CGV Vincom Landmark 81', movie: 'Inside Out 2', times: ['15:00', '17:20', '20:10'] }
  ],
  cinemasNearby: [
    { name: 'CGV Pearl Plaza', address: '561A Điện Biên Phủ, Bình Thạnh' },
    { name: 'BHD Star Bitexco', address: '2 Hải Triều, Q.1' }
  ],
  combos: [
    { name: 'Combo Couple', detail: '1 large popcorn + 2 large drinks – Save 20%' },
    { name: 'Family Combo', detail: '2 large popcorns + 3 large drinks – Save 25%' }
  ],
};

function pickLastUserMessage(messages) {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && m.role === 'user' && typeof m.content === 'string') {
      return m.content.trim();
    }
  }
  return '';
}

function mockAI(messages) {
  const text = pickLastUserMessage(messages).toLowerCase();
  const rules = [
    { test: /(lịch chiếu|showtime|giờ chiếu)/, reply: () => {
      const lines = MOCK_DATA.showtimesToday.map(s => `- ${s.cinema} • ${s.movie}: ${s.times.join(', ')}`).join('\n');
      return `Today's showtimes:\n${lines}\nDo you want to book tickets for any show?`;
    }},
    { test: /(đặt vé|book(ing)?|mua vé)/, reply: () => 'To book tickets: go to the movie or theater page, choose a show, choose a seat, then pay. Which movie and time slot do you want to book?' },
    { test: /(rạp gần|near me|gần tôi)/, reply: () => {
      const lines = MOCK_DATA.cinemasNearby.map(c => `- ${c.name}: ${c.address}`).join('\n');
      return `Theater near you :\n${lines}`;
    }},
    { test: /(ghế|chọn ghế|seat)/, reply: () => 'Tip: middle seats in rows C–F, center of the screen for a good experience. Avoid the front/back rows if not necessary.' },
    { test: /(combo|bắp|nước|snack)/, reply: () => {
      const lines = MOCK_DATA.combos.map(c => `- ${c.name}: ${c.detail}`).join('\n');
      return `Combo offer :\n${lines}`;
    }},
    { test: /(đổi vé|hoàn vé|refund|change)/, reply: () => 'Policy: Contact support ≥ 2 hours before showtime to exchange/refund (subject to conditions depending on showtime/promotion).'},
  ];
  const hit = rules.find(r => r.test && r.test.test && r.test.test(text));
  if (hit) {
    return typeof hit.reply === 'function' ? hit.reply() : hit.reply;
  }
  return 'I am a ticket booking assistant. You can ask: Today\'s showtimes, find theaters near me, book tickets, choose seats, combos, change/refund tickets.';
}

export async function chatAI(messages) {
  const userMessage = pickLastUserMessage(messages);
  let aiResponse;
  
  if (getAIMockEnabled()) {
    aiResponse = mockAI(messages);
  } else {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      if (!res.ok) throw new Error(`AI chat failed: ${res.status}`);
      const data = await res.json();
      aiResponse = data?.reply || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.warn('AI API not available:', error.message);
      aiResponse = mockAI(messages);
    }
  }
  
  // Save the conversation for admin review
  if (userMessage && aiResponse) {
    const username = getCurrentUsername();
    saveChatMessage(userMessage, aiResponse, username);
  }
  
  return aiResponse;
}

function getCurrentUsername() {
  try {
    const userSession = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (userSession) {
      const user = JSON.parse(userSession);
      return user.username || user.name || null;
    }
  } catch (error) {
    console.error('Error getting username:', error);
  }
  return null;
}
