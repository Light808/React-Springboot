/* eslint-disable no-unused-vars */
import React from 'react';
import MovieCard from '../MovieCard/MovieCard';
import styles from './FeaturedMovies.module.css';
import { useTranslation } from "react-i18next";

const FeaturedMovies = ({ movies, title = "Phim đang chiếu", subtitle = "Khám phá những bộ phim hay nhất" }) => {
  const { t } = useTranslation();
  if (!movies || movies.length === 0) {
    return (
      <section className={`${styles['featured-movies']}`}>
        <div className={`${styles['container']}`}>
          <div className={`${styles['section-header']}`}>
            <h2>{t('title')}</h2>
            <p>{t('subtitle')}</p>
          </div>
          <div className={`${styles['no-movies']}`}>
            <p>{t('Không có phim nào để hiển thị')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles['featured-movies']}`}>
      <div className={styles['container']}>
        <div className={`${styles['info-banner']}`}>
          <span className={`${styles['banner-text']}`}>{t('title')}</span>
        </div>
        
        <div className={`${styles['movies-grid']}`}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedMovies;
