/* eslint-disable no-empty */
const API_BASE_URL = 'http://localhost:8080/api';

// ---- Mock config helpers ----
const MOCK_FLAG_KEY = 'ai_mock_enabled';
export function setAIMockEnabled(enabled) {
  try { localStorage.setItem(MOCK_FLAG_KEY, enabled ? 'true' : 'false'); } catch {}
}
export function getAIMockEnabled() {
  try { return localStorage.getItem(MOCK_FLAG_KEY) === 'true'; } catch { return false; }
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
  if (getAIMockEnabled()) {
    return mockAI(messages);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    if (!res.ok) throw new Error(`AI chat failed: ${res.status}`);
    const data = await res.json();
    return data?.reply || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.warn('AI API not available, using mock response:', error.message);
    return mockAI(messages);
  }
}
