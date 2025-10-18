import React from 'react';
import { useTranslation } from 'react-i18next';
import './AboutUsPage.css';

const AboutUsPage = () => {
  const { t } = useTranslation();

  const values = [
    {
      icon: '🎬',
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of the cinema experience'
    },
    {
      icon: '👥',
      title: 'Community',
      description: 'Building a community of movie lovers and entertainment enthusiasts'
    },
    {
      icon: '🌟',
      title: 'Innovation',
      description: 'Embracing cutting-edge technology to enhance your viewing experience'
    },
    {
      icon: '❤️',
      title: 'Passion',
      description: 'Driven by our passion for cinema and storytelling'
    }
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Founded',
      description: 'Galaxy Studio Cinema was established with a vision to revolutionize entertainment'
    },
    {
      year: '2021',
      title: 'First Location',
      description: 'Opened our flagship cinema in Ho Chi Minh City'
    },
    {
      year: '2022',
      title: 'Expansion',
      description: 'Expanded to 5 locations across major cities'
    },
    {
      year: '2023',
      title: 'Technology Upgrade',
      description: 'Introduced IMAX and 4DX technology for premium experiences'
    },
    {
      year: '2024',
      title: 'Digital Platform',
      description: 'Launched our online booking and streaming platform'
    }
  ];

  return (
    <div className="about-us-page">
      <div className="about-us-container">
        {/* Hero Section */}
        <div className="about-us-hero">
          <h1 className="about-us-title">{t('About Galaxy Studio Cinema')}</h1>
          <p className="about-us-subtitle">
            {t('Leading cinema chain providing premium movie experiences with state-of-the-art technology and comfortable seating.')}
          </p>
        </div>

        {/* Mission Section */}
        <div className="mission-section">
          <div className="mission-content">
            <h2 className="section-title">{t('Our Mission')}</h2>
            <p className="mission-text">
              {t('At Galaxy Studio Cinema, we are dedicated to providing exceptional entertainment experiences that bring people together. Our mission is to create magical moments through the power of cinema, offering state-of-the-art facilities, premium comfort, and unforgettable memories for every guest.')}
            </p>
          </div>
          <div className="mission-image">
            <img src="https://via.placeholder.com/500x300/1e293b/dc2626?text=Our+Mission" alt="Our Mission" />
          </div>
        </div>

        {/* Values Section */}
        <div className="values-section">
          <h2 className="section-title">{t('Our Values')}</h2>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">{value.icon}</div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="timeline-section">
          <h2 className="section-title">{t('Our Journey')}</h2>
          <div className="timeline">
            {milestones.map((milestone, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-year">{milestone.year}</div>
                  <h3 className="timeline-title">{milestone.title}</h3>
                  <p className="timeline-description">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="team-section">
          <h2 className="section-title">{t('Leadership Team')}</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-photo">
                <img src="https://via.placeholder.com/200x200/1e293b/dc2626?text=CEO" alt="CEO" />
              </div>
              <h3 className="member-name">{t('Nguyen Van A')}</h3>
              <p className="member-position">{t('Chief Executive Officer')}</p>
              <p className="member-bio">{t('Visionary leader with 15+ years in entertainment industry')}</p>
            </div>
            <div className="team-member">
              <div className="member-photo">
                <img src="https://via.placeholder.com/200x200/1e293b/dc2626?text=CTO" alt="CTO" />
              </div>
              <h3 className="member-name">{t('Tran Thi B')}</h3>
              <p className="member-position">{t('Chief Technology Officer')}</p>
              <p className="member-bio">{t('Technology innovator specializing in cinema systems')}</p>
            </div>
            <div className="team-member">
              <div className="member-photo">
                <img src="https://via.placeholder.com/200x200/1e293b/dc2626?text=COO" alt="COO" />
              </div>
              <h3 className="member-name">{t('Le Van C')}</h3>
              <p className="member-position">{t('Chief Operating Officer')}</p>
              <p className="member-bio">{t('Operations expert ensuring smooth cinema experiences')}</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h2 className="section-title">{t('Get in Touch')}</h2>
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div className="contact-details">
                <h3>{t('Headquarters')}</h3>
                <p>146A Nguyen Van Qua Street, Dong Hung Thuan Ward, District 12, Ho Chi Minh City</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div className="contact-details">
                <h3>{t('Phone')}</h3>
                <p>1900 1234</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">✉️</div>
              <div className="contact-details">
                <h3>{t('Email')}</h3>
                <p>info@galaxystudio.vn</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
