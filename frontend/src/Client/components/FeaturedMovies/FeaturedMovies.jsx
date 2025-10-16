import MovieCard from '../MovieCard/MovieCard';
import styles from './FeaturedMovies.module.css';
import { useTranslation } from 'react-i18next';

const FeaturedMovies = ({ movies, title = 'Now Showing', subtitle = 'Explore top-rated movies' }) => {
  const { t } = useTranslation();
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

  return (
    <section className={`${styles['featured-movies']}`}>
      <div className={styles['container']}>
        <div className={`${styles['info-banner']}`}>
          <span className={`${styles['banner-text']}`}>{title}</span>
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
