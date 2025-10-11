import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className={`main-footer`}> 
      <div className={`footer-content`}>
        <div className={`company-section`}>
          <div className={`company-logo`}>
            <img className={`company-logo-img`} src="https://cdn.moveek.com/bundles/ornweb/img/favicon-large.png" alt="HAK" />
          </div>
          
          <div className={`company-info`}>
            <h3 className={`company-name`}>CÔNG TY TNHH HAK</h3>
            
            <div className={`company-details`}>
              <p><strong>{t('Business Registration No')}: </strong> 0932082976 </p>
              <p><strong>{t('Issued by:')}</strong> {t('Department of Planning and Investment of Ho Chi Minh City')} </p>
              <p><strong>{t('First registration date:')}</strong> 01/09/2025</p>
              <p><strong>{t('Address')}:</strong> {t('146A Nguyen Van Qua Street, Dong Hung Thuan Ward, District 12, Ho Chi Minh City')}</p>
            </div>
            
            <div className={`footer-links`}>
              <Link to="/about"> {t('About us')}</Link>
              <span> - </span>
              <Link to="/privacy"> {t('Privacy')}</Link>
              <span> - </span>
              <Link to="/support"> {t('Support')}</Link>
              <span> - </span>
              <Link to="/contact">{t('Contact')}</Link>
              <span> - </span>
              <span className={`version`}>v8.1</span>
            </div>
            </div>
          </div>
        </div>

        {/* Right Section - Partners */}
        <div className={`partners-section`}>
          <h3 className={`partners-title`}>{t('Partner')}</h3>
          
          <div className={`partners-grid`}>
            <div className={`partners-row`}>
              <a href="https://betacineplex.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/beta-cineplex-v2.jpg" alt="Beta Cinemas" />
              </a>
              <a href="https://www.megagscinemas.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/mega-gs-cinemas.png" alt="Mega GS" />
              </a>
              <a href="https://cinestar.com.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/cinestar.png" alt="Cinestar" />
              </a>
              <a href="https://ddcinema.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/dcine.png" alt="DDC Dongda Cinema" />
              </a>
              <a href="https://ddcinema.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/dong-da-cinemas.png" alt="Dongda Cinema" />
              </a>
              <a href="https://www.online.gov.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo certified`}>
                <div className={`certified-badge`}>
                  <img src="https://cdn.moveek.com/bundles/ornweb/img/20150827110756-dathongbao.png" alt="Đã thông báo Bộ Công Thương" />
                </div>
              </a>
            </div>
            
            {/* Second Row */}
            <div className={`partners-row`}>
              <a href="https://cinemaxvn.com/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/cinemax.png" alt="Cinemas" />
              </a>
              <a href="https://touchcinema.com/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/touch-cinemas.png" alt="Touch Cinema" />
              </a>
              <a href="https://payoo.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/payoo.jpg" alt="Payoo" />
              </a>
              <a href="https://www.momo.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/momo.png" alt="MoMo" />
              </a>
              <a href="https://zalopay.vn/" target="_blank" rel="noopener noreferrer" className={`partner-logo`}>
                <img src="https://cdn.moveek.com/bundles/ornweb/partners/zalopay-icon.png" alt="ZaloPay" />
              </a>
              
            </div>
          </div>
        </div>
    </footer>
  );
};

export default Footer;
