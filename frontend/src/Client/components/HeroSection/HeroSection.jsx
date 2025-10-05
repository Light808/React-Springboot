import React from 'react';
import { Play } from 'lucide-react';
import styles from './HeroSection.module.css';
import { useTranslation } from 'react-i18next';

const HeroSection = () => {
  const { t } = useTranslation();
  return (
    <section className={styles['hero-section']}>
      <div className={`${styles['hero-background']}`}>
        <div className={`${styles['hero-content']}`}>
          <div className={`${styles['hero-text']}`}>
            <h1 className={`${styles['hero-title']}`}>{t('Welcometocinema')}</h1>
            <p className={`${styles['hero-subtitle']}`}>{t('Ticketbookingplatform')}</p>
            <div className={`${styles['hero-actions']}`}>
              <button className={`${styles['hero-btn']} ${styles['primary']}`}>
                <Play size={20} />
                Khám phá ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
