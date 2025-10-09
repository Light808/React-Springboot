/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Phone, Clock, Star } from 'lucide-react';
import { getAllCinemas as getCinemas } from '../../../services/cinemaService';
import styles from './CinemasPage.module.css';
import { useTranslation } from 'react-i18next';
  
const CinemasPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        setLoading(true);
        const data = await getCinemas();
        setCinemas(data);
        setError(null);
      } catch (err) {
        setError(t('CinemaNotFound'));
        console.error('Error fetching cinemas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCinemas();
  }, [t]);

  const cities = React.useMemo(() => {
    const set = new Set();
    cinemas?.forEach(c => { if (c.city) set.add(c.city); });
    return Array.from(set).sort(); 
  }, [cinemas, t]);

  const districts = [
    'Quận 1',
    'Quận 3',
    'Quận 5',
    'Quận 7',
    'Quận Tân Phú',
    'Quận Bình Tân'
  ];

  // Function to remove Vietnamese diacritics for search
  const removeVietnameseDiacritics = (str) => {
    if (!str) return '';
    
    return str
      .normalize('NFD') 
      .replace(/[\u0300-\u036f]/g, '') 
      .replace(/đ/g, 'd').replace(/Đ/g, 'D') 
      .toLowerCase();
  };

  // Function to check if text contains search query 
  const containsSearchQuery = (text, query) => {
    if (!text || !query) return false;
    
    const normalizedText = removeVietnameseDiacritics(text);
    const normalizedQuery = removeVietnameseDiacritics(query);
    
    return normalizedText.includes(normalizedQuery);
  };

  const filteredCinemas = cinemas.filter(cinema => {
    const matchesCity = !selectedCity || cinema.city === selectedCity;
    const matchesSearch = !searchQuery || containsSearchQuery(cinema.name, searchQuery) ||
                         containsSearchQuery(cinema.address, searchQuery) ||
                         containsSearchQuery(cinema.cinemaName, searchQuery);
    const matchesDistrict = !selectedDistrict || cinema.address?.includes(selectedDistrict);
    return matchesCity && matchesSearch && matchesDistrict;
  });

  if (loading) {
    return (
      <div className={`${styles['cinemas-page']}`}>      
        <div className={`${styles['page-hero']}`}>
          <div className={styles['hero-inner']}>  
            <h1>{t('Cinema')}</h1>
            <p>{t('LoadingCinemaData')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles['cinemas-page']}`}>
        <div className={`${styles['page-hero']}`}>
          <div className={`${styles['hero-inner']}`}>
            <h1>{t('Cinema')}</h1>
            <p>{t('LoadingCinemaDataFailed')}</p>
          </div>
        </div>
          <div className={`${styles['page-content']}`}>
          <div className={`${styles['error-message']}`}>   
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>{t('TryAgain')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles['cinemas-page']}`}>
      <div className={`${styles['page-hero']}`}>
        <div className={styles['hero-inner']}>
          <h1>{t('Cinema')}</h1>
          <p>{t('FindYourFavoriteCinema') || 'Find theaters near you and book tickets quickly'}</p>

          <div className={styles['hero-search']}> 
            <div className={styles['search-input-wrap']}>
              <Search size={18} className={styles['search-icon']} />
              <input
                type="text"
                placeholder={t('searchCinema')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles['search-input']}
              />
            </div>

            <div className={styles['hero-filters']}>
              <div className={styles['chip']}> 
                <MapPin size={14} />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="">{t('AllCities')}</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles['chip']}>
                <MapPin size={14} />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="">{t('allDistricts')}</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles['chip']}>
                <Filter size={14} />
                <select>
                  <option value="rating">{t('Rating')}</option>
                  <option value="name">{t('Name')}</option>
                  <option value="distance">{t('Nearest')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles['page-content']}`}>
        <div className={styles['results-header']}>
          <h2>{t('SearchResults')}</h2>
          <span className={styles['results-count']}>
            {filteredCinemas.length} {t('Cinemas')}
          </span>
        </div>

        {filteredCinemas.length === 0 ? (
          <div className={`${styles['no-results']}`}>
            <p>{t('NoCinemasFound')}</p>
          </div>
        ) : (
          <div className={styles['grid']}>
            {filteredCinemas.map(cinema => (
              <div key={cinema.id} className={styles['card']}>
                <div className={styles['card-header']}>
                  <div className={styles['card-media']}>
                    {cinema.imageUrl ? (
                      <img src={cinema.imageUrl} alt={cinema.name} onError={(e)=>{e.target.style.display='none';}} />
                    ) : (
                      <div className={styles['media-placeholder']}>{cinema.name?.charAt(0) || 'C'}</div>
                    )}
                  </div>
                  <div className={styles['card-title']}>
                    <h3>{cinema.name || cinema.cinemaName}</h3>
                    <div className={styles['rating']}>
                      <Star size={14} /> <span>N/A</span>
                    </div>
                  </div>
                </div>
                <div className={styles['card-body']}>
                  <div className={styles['line']}>
                    <MapPin size={14} />
                    <span>{cinema.address}</span>
                  </div>
                  <div className={styles['line']}>
                    <Phone size={14} />
                    <span>{cinema.phone || '028 1234 5678'}</span>
                  </div>
                  <div className={styles['line']}>
                    <Clock size={14} />
                    <span>{cinema.openingHours || '08:00 - 23:00'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CinemasPage;