import React from 'react';
import { useTranslation } from 'react-i18next';
import './GiftCardsPage.css';

const GiftCardsPage = () => {
  const { t } = useTranslation();

  const giftCards = [
    {
      id: 1,
      name: "Galaxy Studio Gift Card - 100K",
      price: "100,000 VNĐ",
      image: "https://via.placeholder.com/300x200/1e293b/dc2626?text=Gift+Card+100K",
      description: "Perfect for a movie night with friends or family"
    },
    {
      id: 2,
      name: "Galaxy Studio Gift Card - 200K",
      price: "200,000 VNĐ",
      image: "https://via.placeholder.com/300x200/1e293b/dc2626?text=Gift+Card+200K",
      description: "Great for special occasions and celebrations"
    },
    {
      id: 3,
      name: "Galaxy Studio Gift Card - 500K",
      price: "500,000 VNĐ",
      image: "https://via.placeholder.com/300x200/1e293b/dc2626?text=Gift+Card+500K",
      description: "Premium experience for movie enthusiasts"
    },
    {
      id: 4,
      name: "Galaxy Studio Gift Card - 1M",
      price: "1,000,000 VNĐ",
      image: "https://via.placeholder.com/300x200/1e293b/dc2626?text=Gift+Card+1M",
      description: "Ultimate gift for cinema lovers"
    }
  ];

  return (
    <div className="gift-cards-page">
      <div className="gift-cards-container">
        {/* Hero Section */}
        <div className="gift-cards-hero">
          <h1 className="gift-cards-title">{t('Gift Cards')}</h1>
          <p className="gift-cards-subtitle">
            {t('Give the gift of entertainment with Galaxy Studio Cinema gift cards. Perfect for any occasion!')}
          </p>
        </div>

        {/* Features Section */}
        <div className="gift-cards-features">
          <div className="feature-card">
            <div className="feature-icon">🎁</div>
            <h3>{t('Perfect Gift')}</h3>
            <p>{t('Ideal for birthdays, holidays, and special occasions')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>{t('Easy to Use')}</h3>
            <p>{t('Simply present at any Galaxy Studio location')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>{t('No Expiration')}</h3>
            <p>{t('Gift cards never expire, use anytime')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎬</div>
            <h3>{t('Any Movie')}</h3>
            <p>{t('Valid for all movies and showtimes')}</p>
          </div>
        </div>

        {/* Gift Cards Grid */}
        <div className="gift-cards-grid">
          <h2 className="section-title">{t('Available Gift Cards')}</h2>
          <div className="cards-grid">
            {giftCards.map((card) => (
              <div key={card.id} className="gift-card">
                <div className="card-image">
                  <img src={card.image} alt={card.name} />
                  <div className="card-overlay">
                    <button className="buy-button">{t('Buy Now')}</button>
                  </div>
                </div>
                <div className="card-content">
                  <h3 className="card-name">{card.name}</h3>
                  <p className="card-price">{card.price}</p>
                  <p className="card-description">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Use Section */}
        <div className="how-to-use">
          <h2 className="section-title">{t('How to Use Gift Cards')}</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>{t('Purchase')}</h3>
                <p>{t('Buy a gift card online or at any Galaxy Studio location')}</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>{t('Present')}</h3>
                <p>{t('Give the gift card to your loved one')}</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>{t('Enjoy')}</h3>
                <p>{t('Use it to purchase tickets, snacks, or drinks')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="terms-section">
          <h2 className="section-title">{t('Terms & Conditions')}</h2>
          <div className="terms-content">
            <ul>
              <li>{t('Gift cards are valid at all Galaxy Studio Cinema locations')}</li>
              <li>{t('Gift cards cannot be redeemed for cash')}</li>
              <li>{t('Gift cards do not expire')}</li>
              <li>{t('Lost or stolen gift cards cannot be replaced')}</li>
              <li>{t('Gift cards can be used for tickets, concessions, and merchandise')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCardsPage;
