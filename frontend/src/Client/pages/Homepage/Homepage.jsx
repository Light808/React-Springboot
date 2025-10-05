/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import HeroSection from '../../components/HeroSection/HeroSection';
import FeaturedMovies from '../../components/FeaturedMovies/FeaturedMovies';
import { getMovies } from '../../../services/movieService';
import './Homepage.css';
import { useTranslation } from 'react-i18next';

const Homepage = () => {
  const { t } = useTranslation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('nowShowing');
  const today = new Date();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const data = await getMovies();
        setMovies(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Không thể tải danh sách phim');
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const nowShowingMovies = movies.filter(
    (movie) => movie.releaseDate && new Date(movie.releaseDate) <= today
  );
  const comingSoonMovies = movies.filter(
    (movie) => movie.releaseDate && new Date(movie.releaseDate) > today
  );
  const featuredMovies = movies.filter(
    (movie) => movie.featured === true
  );

  const tabs = [
    { key: 'nowShowing', label: t('nowShowing'), movies: nowShowingMovies },
    { key: 'comingSoon', label: t('comingSoon'), movies: comingSoonMovies },
  ];

  if (loading) {
    return (
      <div className="homepage">  
        <div className="loading-container"> 
          <div className="loading-spinner"></div>
          <p>{t('Loadinghomepage')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reload Server</button>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <main className="main-content">
        <HeroSection />
        <div className="content-wrapper" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="movie-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`movie-tab-btn${selectedTab === tab.key ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <FeaturedMovies
            movies={tabs.find(tab => tab.key === selectedTab).movies}
            title={tabs.find(tab => tab.key === selectedTab).label}
          />
        </div>
      </main>
    </div>
  );
};

export default Homepage;
