import React from 'react';
import { useTranslation } from 'react-i18next';

const CinemaSelector = ({ cinemas, onSelectCinema }) => {
  const { t } = useTranslation();
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor="cinema" style={{ marginRight: 8 }}>{t('Choose Cinema:')}</label>
      <select id="cinema" onChange={(e) => onSelectCinema(e.target.value)} style={{ padding: 8, borderRadius: 4 }}>
        <option value="">{t('All')}</option>
        {cinemas.map((cinema) => (
          <option key={cinema.id} value={cinema.id}>
            {cinema.name} - {cinema.address}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CinemaSelector;
