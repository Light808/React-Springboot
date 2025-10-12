import React from 'react';
import { getCurrentUserSync } from '../../../services/userService';
import { getMemberOverview, getMemberTransactions, getMemberNews } from '../../../services/memberService';
import { useTranslation } from 'react-i18next';

const MembershipPage = () => {
  const { t } = useTranslation();
  const user = getCurrentUserSync();
  const [overview, setOverview] = React.useState({ name: user?.fullName || user?.username || 'Thành viên CGV', tier: user?.tier || 'Member', points: user?.rewardPoints ?? 0, promotions: [] });
  const [transactions, setTransactions] = React.useState([]);
  const [setNews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [ov, tx, nw] = await Promise.all([
          getMemberOverview().catch(() => null),
          getMemberTransactions().catch(() => []),
          getMemberNews().catch(() => [])
        ]);
        if (ov) setOverview(ov);
        setTransactions(tx || []);
        setNews(nw || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t('Thành viên CGV')}</h1>
      <p style={{ color: '#4b5563' }}>{t('Tích điểm khi mua vé/combos, lên hạng để nhận ưu đãi độc quyền.')}</p>

      {/* info */}
      <section style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.125rem' }}>1. {t('Thông tin tài khoản thành viên')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem' }}>
            <strong>{t('Tên')}</strong>
            <div>{overview.name}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem' }}>
            <strong>{t('Hạng thẻ')}</strong>
            <div>{overview.tier}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem' }}>
            <strong>{t('Điểm tích lũy')}</strong>
            <div>{Number(overview.points || 0).toLocaleString('vi-VN')}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem' }}>
            <strong>{t('Khuyến mãi theo hạng')}</strong>
           <div>  {overview.promotions?.[0] || t('Ưu đãi giảm giá và combo theo hạng {{tier}}', { tier: overview.tier })}</div>
          </div>
        </div>

        <div style={{ marginTop: '0.75rem' }}>
          <strong>{t('Lịch sử giao dịch')}</strong>
          {loading ? (
            <div>{t('Đang tải...')}</div>
          ) : (
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: '#374151', lineHeight: 1.8 }}>
              {transactions.length === 0 ? (
                <li>{t('Chưa có giao dịch')}</li>
              ) : (
                transactions.slice(0, 5).map((tx, idx) => (
                  <li key={idx}>{tx.type} - {Number(tx.amount || 0).toLocaleString('vi-VN')}đ - {new Date(tx.time).toLocaleString('vi-VN')}</li>
                ))
              )}
            </ul>
          )}
        </div>
      </section>

      {/* tier system */}
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.125rem' }}>2. {t('Hệ thống hạng thẻ')}</h2>
        <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}>{t('Mô tả và điều kiện đạt hạng trong năm:')}</p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#374151', lineHeight: 1.8 }}>
          <li><strong>Member</strong>: {t('Tổng chi tiêu < 1.000.000đ / năm hoặc < 12 vé; ưu đãi cơ bản.')}</li>
          <li><strong>VIP</strong>: {t('1.000.000–3.000.000đ/năm hoặc 12–30 vé; ưu đãi tăng 1.2x, combo giảm giá.')}</li>
          <li><strong>VVIP</strong>: {t('> 3.000.000đ/năm hoặc > 30 vé; ưu đãi 1.5x, suất chiếu đặc biệt, ưu tiên sự kiện.')}</li>
        </ul>
      </section>

      {/* benefits */}
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.125rem' }}>3. {t('Ưu đãi và khuyến mãi dành riêng')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#374151', lineHeight: 1.8 }}>
          <li>Voucher/coupon {t('giảm giá vé theo hạng.')}</li>
          <li>Combo {t('bắp nước ưu đãi dành riêng cho hội viên.')}</li>
          <li>{t('Chương trình Members Day, Sinh nhật thành viên.')}</li>
          <li>{t('Ưu đãi đối tác (ngân hàng, ví điện tử...).')}</li>
        </ul>
      </section>

      {/* points */}
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.125rem' }}>4. {t('Chính sách tích & sử dụng điểm')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#374151', lineHeight: 1.8 }}>
          <li>{t('Tích 5–10% giá trị hóa đơn vào điểm thưởng.')}</li>
          <li>{t('Điểm dùng để đổi vé, combo, voucher.')}</li>
          <li>{t('Điểm có thời hạn sử dụng; vui lòng theo dõi trong tài khoản.')}</li>
        </ul>
      </section>

      {/* news */}
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.125rem' }}>5. Tin tức & sự kiện</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#374151', lineHeight: 1.8 }}>
          <li>{t('Sự kiện dành riêng cho hội viên: sneak show, suất chiếu sớm.')}</li>
          <li>{t('Hoạt động tri ân thành viên định kỳ.')}</li>
        </ul>
      </section>
    </div>
  );
};

export default MembershipPage;


