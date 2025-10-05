import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PRIZES, spinOnce, canSpinToday, recordSpin, addSpinHistory, getSpinHistory, updateStreakAfterSpin, hasCheckedInToday, checkInToday } from '../../services/rewardService';
import { getCurrentUserSync } from '../../services/userService';

const DailySpinPage = () => {
  const navigate = useNavigate();
  const user = getCurrentUserSync();
  const userId = user?.id;
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => getSpinHistory(userId));
  const [streak, setStreak] = useState(() => updateStreakAfterSpin(userId));
  const [checkedIn, setCheckedIn] = useState(() => hasCheckedInToday(userId));
  const prizes = useMemo(() => DEFAULT_PRIZES, []);

  // Hover roulette state
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef(null);
  const slowdownTimeoutsRef = useRef([]);
  const isAnimatingRef = useRef(false);

  const clearAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    slowdownTimeoutsRef.current.forEach(t => clearTimeout(t));
    slowdownTimeoutsRef.current = [];
    isAnimatingRef.current = false;
  };

  const handleCheckIn = () => {
    if (!userId) {
      alert('Vui lòng đăng nhập để điểm danh.');
      navigate('/');
      return;
    }
    if (checkedIn) return;
    const ok = checkInToday(userId);
    setCheckedIn(ok);
    if (!ok) alert('Điểm danh thất bại. Vui lòng thử lại.');
  };

  const startHoverSpin = () => {
    if (!userId) {
      alert('Vui lòng đăng nhập để tham gia quay thưởng.');
      navigate('/');
      return;
    }
    if (!checkedIn) {
      alert('Bạn cần điểm danh trước khi quay.');
      return;
    }
    if (!canSpinToday(userId)) {
      alert('Bạn đã quay hôm nay rồi. Hãy quay lại vào ngày mai!');
      return;
    }
    if (isAnimatingRef.current || spinning) return;

    isAnimatingRef.current = true;
    setSpinning(true);
    setResult(null);

    let speed = 60; // ms
    const runStep = () => {
      setActiveIndex(prev => (prev + 1) % prizes.length);
    };
    intervalRef.current = setInterval(runStep, speed);

    // Slowdown phases
    const phases = [140, 220, 320, 480];
    phases.forEach((nextSpeed, i) => {
      const timeout = setTimeout(() => {
        if (!intervalRef.current) return;
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(runStep, nextSpeed);
      }, 400 + i * 350);
      slowdownTimeoutsRef.current.push(timeout);
    });

    // Stop and award at the end
    const stopTimeout = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Pick a random prize index to stop on
      const prize = spinOnce(prizes);
      const targetIndex = Math.max(0, prizes.findIndex(p => p.id === prize.id));
      setActiveIndex(targetIndex);

      // Record reward
      recordSpin(userId);
      const nextHistory = addSpinHistory(userId, prize);
      setHistory(nextHistory);
      const nextStreak = updateStreakAfterSpin(userId);
      setStreak(nextStreak);
      setResult(prize);

      clearAnimation();
      setSpinning(false);
    }, 400 + phases.length * 350 + 600);
    slowdownTimeoutsRef.current.push(stopTimeout);
  };

  const handleMouseEnter = () => {
    startHoverSpin();
  };

  const handleMouseLeave = () => {
    // Do nothing; animation will naturally slow and stop
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      <h1 style={{ marginBottom: 8 }}>Vòng quay may mắn</h1>
      <p style={{ marginTop: 0, color: '#666' }}>Đăng nhập mỗi ngày để nhận quà hấp dẫn.</p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 520px', minWidth: 360 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Phần thưởng</h3>
              <div>
                <button
                  onClick={handleCheckIn}
                  disabled={!userId || checkedIn}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: (!userId || checkedIn) ? '#9ca3af' : '#10b981',
                    color: '#fff',
                    cursor: (!userId || checkedIn) ? 'not-allowed' : 'pointer',
                    fontWeight: 700
                  }}
                >
                  {checkedIn ? 'Đã điểm danh' : 'Điểm danh'}
                </button>
              </div>
            </div>
            <div 
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'relative',
                border: '1px solid #d1d5db',
                borderRadius: 12,
                padding: 12,
                overflow: 'hidden',
                background: '#0f172a'
              }}
            >
              {/* Highlight bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  bottom: 8,
                  left: '50%',
                  width: 120,
                  transform: 'translateX(-50%)',
                  border: '2px dashed #f97316',
                  borderRadius: 10,
                  pointerEvents: 'none',
                  boxShadow: 'inset 0 0 0 1px rgba(249,115,22,0.25)'
                }}
              />

              {/* Prize items track */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', minHeight: 86, justifyContent: 'center', flexWrap: 'nowrap' }}>
                {prizes.map((p, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={p.id}
                      style={{
                        flex: '0 0 120px',
                        borderRadius: 10,
                        padding: '10px 8px',
                        background: isActive ? 'linear-gradient(180deg, #f97316, #ef4444)' : '#111827',
                        color: isActive ? '#fff' : '#e5e7eb',
                        textAlign: 'center',
                        boxShadow: isActive ? '0 6px 16px rgba(239,68,68,0.35)' : 'none',
                        transform: isActive ? 'scale(1.05)' : 'scale(1.0)',
                        transition: 'transform 120ms ease, background 120ms ease, color 120ms ease'
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 6 }}>🎁</div>
                      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: '18px' }}>{p.label}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 10, color: '#93c5fd', textAlign: 'center', fontSize: 13 }}>
                {spinning ? 'Đang quay... giữ chuột để xem!' : (!userId ? 'Đăng nhập để tham gia' : (!checkedIn ? 'Hãy bấm Điểm danh để nhận lượt quay' : (canSpinToday(userId) ? 'Di chuột vào vùng trên để quay' : 'Bạn đã quay hôm nay')))}
              </div>
            </div>

            {result && (
              <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                <strong>Kết quả:</strong> {result.label}
              </div>
            )}
            <div style={{ marginTop: 12, color: '#374151' }}>
              Chuỗi ngày liên tiếp: <strong>{streak}</strong>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 320 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Lịch sử quay</h3>
            {history.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Chưa có lượt quay nào.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {history.map(h => (
                  <li key={h.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{h.reward.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(h.date).toLocaleString('vi-VN')}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySpinPage;
