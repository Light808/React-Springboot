/* eslint-disable no-empty */
const STORAGE_KEYS = {
  LAST_SPIN_DATE: (userId) => `reward_last_spin_date_${userId}`,
  SPIN_HISTORY: (userId) => `reward_spin_history_${userId}`,
  STREAK: (userId) => `reward_spin_streak_${userId}`,
  CHECKIN_DATE: (userId) => `reward_checkin_date_${userId}`,
  COINS: (userId) => `reward_coins_${userId}`,
  REDEEM_HISTORY: (userId) => `reward_redeem_history_${userId}`
};

function getTodayISODate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLastSpinDate(userId) {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SPIN_DATE(userId));
  } catch {
    return null;
  }
}

export function hasCheckedInToday(userId) {
  if (!userId) return false;
  try {
    const val = localStorage.getItem(STORAGE_KEYS.CHECKIN_DATE(userId));
    return val === getTodayISODate();
  } catch {
    return false;
  }
}

export function checkInToday(userId) {
  if (!userId) return false;
  try {
    const today = getTodayISODate();
    localStorage.setItem(STORAGE_KEYS.CHECKIN_DATE(userId), today);
    return true;
  } catch {
    return false;
  }
}

// Coins
export function getCoins(userId) {
  if (!userId) return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COINS(userId));
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setCoins(userId, amount) {
  if (!userId) return 0;
  const safe = Math.max(0, Math.floor(amount || 0));
  try {
    localStorage.setItem(STORAGE_KEYS.COINS(userId), String(safe));
  } catch {}
  return safe;
}

export function addCoins(userId, delta) {
  if (!userId) return 0;
  const next = getCoins(userId) + Math.floor(delta || 0);
  return setCoins(userId, next);
}

export function grantCheckInCoins(userId, amount = 10) {
  if (!userId) return { granted: false, coins: 0 };
  if (!hasCheckedInToday(userId)) return { granted: false, coins: getCoins(userId) };
  const coins = addCoins(userId, amount);
  return { granted: true, coins };
}

// Spin-related (legacy, kept for compatibility)
export function canSpinToday(userId) {
  if (!userId) return false;
  if (!hasCheckedInToday(userId)) return false;
  const last = getLastSpinDate(userId);
  const today = getTodayISODate();
  return last !== today;
}

export function recordSpin(userId) {
  if (!userId) return;
  try {
    const today = getTodayISODate();
    localStorage.setItem(STORAGE_KEYS.LAST_SPIN_DATE(userId), today);
  } catch {}
}

export function getSpinHistory(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SPIN_HISTORY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSpinHistory(userId, reward) {
  if (!userId) return [];
  const history = getSpinHistory(userId);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    reward
  };
  const next = [entry, ...history].slice(0, 50);
  try {
    localStorage.setItem(STORAGE_KEYS.SPIN_HISTORY(userId), JSON.stringify(next));
  } catch {}
  return next;
}

export function getStreak(userId) {
  if (!userId) return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK(userId));
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function updateStreakAfterSpin(userId) {
  if (!userId) return 0;
  const last = getLastSpinDate(userId);
  const today = getTodayISODate();
  if (last === today) {
    return getStreak(userId);
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  const next = last === yISO ? getStreak(userId) + 1 : 1;
  try {
    localStorage.setItem(STORAGE_KEYS.STREAK(userId), String(next));
  } catch {}
  return next;
}

// Rewards catalog and redemption
export const DEFAULT_CATALOG = [
  { id: 'voucher_10', label: 'Voucher 10% vé', coinCost: 50 },
  { id: 'voucher_20', label: 'Voucher 20% vé', coinCost: 90 },
  { id: 'free_popcorn', label: 'Bắp miễn phí', coinCost: 60 },
  { id: 'free_drink', label: 'Nước miễn phí', coinCost: 60 },
  { id: 'free_ticket', label: '1 vé miễn phí', coinCost: 200 }
];

export function getCatalog() {
  return DEFAULT_CATALOG;
}

export function getRedeemHistory(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REDEEM_HISTORY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRedeemHistory(userId, reward) {
  if (!userId) return [];
  const history = getRedeemHistory(userId);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    reward
  };
  const next = [entry, ...history].slice(0, 100);
  try {
    localStorage.setItem(STORAGE_KEYS.REDEEM_HISTORY(userId), JSON.stringify(next));
  } catch {}
  return next;
}

export function redeemReward(userId, rewardId) {
  if (!userId) return { ok: false, reason: 'no_user', coins: 0 };
  const catalog = getCatalog();
  const reward = catalog.find(r => r.id === rewardId);
  if (!reward) return { ok: false, reason: 'not_found', coins: getCoins(userId) };
  const balance = getCoins(userId);
  if (balance < reward.coinCost) return { ok: false, reason: 'insufficient', coins: balance };

  setCoins(userId, balance - reward.coinCost);
  addRedeemHistory(userId, reward);
  return { ok: true, reward, coins: getCoins(userId) };
}

// Legacy prizes kept (not used by coin system)
export const DEFAULT_PRIZES = [
  { id: 'voucher_10', label: 'Voucher 10% vé', weight: 25 },
  { id: 'voucher_20', label: 'Voucher 20% vé', weight: 18 },
  { id: 'free_popcorn', label: 'Bắp miễn phí', weight: 15 },
  { id: 'free_drink', label: 'Nước miễn phí', weight: 15 },
  { id: 'nothing', label: 'Chúc bạn may mắn lần sau', weight: 20 },
  { id: 'free_ticket', label: '1 vé miễn phí', weight: 7 }
];

export function spinOnce(prizes = DEFAULT_PRIZES) {
  const totalWeight = prizes.reduce((sum, p) => sum + (p.weight || 1), 0);
  let rnd = Math.random() * totalWeight;
  for (let i = 0; i < prizes.length; i++) {
    rnd -= (prizes[i].weight || 1);
    if (rnd <= 0) {
      return prizes[i];
    }
  }
  return prizes[prizes.length - 1];
}
