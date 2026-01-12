import React, { useState, useEffect } from 'react';
import MovieCard from '../MovieCard/MovieCard';
import styles from './FeaturedMovies.module.css';
import { useTranslation } from 'react-i18next';

const FeaturedMovies = ({ movies, title = 'Now Showing', subtitle = 'Explore top-rated movies' }) => {
  const { t } = useTranslation();
  const [displayedCount, setDisplayedCount] = useState(3);
  const [itemsPerLoad] = useState(3);

  // Reset displayed count when movies change
  useEffect(() => {
    setDisplayedCount(3);
  }, [movies]);

  if (!movies || movies.length === 0) {
    return (
      <section className={`${styles['featured-movies']}`}>
        <div className={`${styles['container']}`}>
          <div className={`${styles['section-header']}`}>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className={`${styles['no-movies']}`}>
            <p>{t('NoMoviesToDisplay')}</p>
          </div>
        </div>
      </section>
    );
  }

  // Get movies to display
  const displayedMovies = movies.slice(0, displayedCount);
  const hasMore = displayedCount < movies.length;

  // Load more handler
  const handleLoadMore = () => {
    setDisplayedCount(prev => Math.min(prev + itemsPerLoad, movies.length));
  };

  return (
    <section className={`${styles['featured-movies']}`}>
      <div className={styles['container']}>
        <div className={`${styles['info-banner']}`}>
          <span className={`${styles['banner-text']}`}>{title}</span>
        </div>
        
        <div className={`${styles['movies-grid']}`}>
          {displayedMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {hasMore && (
          <div className={styles['load-more-container']}>
            <button
              className={styles['load-more-button']}
              onClick={handleLoadMore}
            >
              {t('ViewMore') || 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedMovies;
