/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useRef } from 'react';
import './MovieCarousel.css';

const MovieCarousel = ({ movies }) => {
  if (!movies || movies.length === 0) return null;

  // Duplicate the movie list for seamless scrolling
  const duplicatedMovies = [...movies, ...movies];
  const trackRef = useRef(null);

  const getImageUrl = (movie) =>
    movie.posterUrl || movie.poster || movie.imageUrl || movie.image || '/default-movie.jpg';

  const getTitle = (movie) =>
    movie.title || movie.name || movie.movieName || 'Unknown Title';

  useEffect(() => {
    const track = trackRef.current;
    let animationFrame;
    let position = 0;
    let speed = 0.5;
    let paused = false;

    const move = () => {
      if (!paused) {
        position -= speed;
        if (Math.abs(position) >= track.scrollWidth / 2) {
          position = 0;
        }
        track.style.transform = `translateX(${position}px)`;
      }
      animationFrame = requestAnimationFrame(move);
    };

    move();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <section className="movie-carousel">
      <div
        className="carousel-container"
        onMouseEnter={() => (trackRef.current.paused = true)}
        onMouseLeave={() => (trackRef.current.paused = false)}
      >
        <div
          className="carousel-track"
          ref={trackRef}
          style={{
            width: `${200 * duplicatedMovies.length}px`,
          }}
        >
          {duplicatedMovies.map((movie, index) => (
            <div key={`${movie.id}-${index}`} className="carousel-item">
              <img
                src={getImageUrl(movie)}
                alt={getTitle(movie)}
                onError={(e) => {
                  e.target.src = '/default-movie.jpg';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MovieCarousel;
