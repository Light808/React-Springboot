import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import './DateSelector.css';
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";


const DateSelector = ({ selectedDate, onDateChange }) => {
  const { t } = useTranslation();
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
  

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = [t('CN'), t('T2'), t('T3'), t('T4'), t('T5'), t('T6'), t('T7')];
      const dayName = dayNames[date.getDay()];
      
      dates.push({
        date: date,
        day: date.getDate(),
        month: date.getMonth() + 1,
        dayName: dayName,
        fullDate: date.toISOString().split('T')[0] 
      });
    }
    
    return dates;
  };

  const dates = generateDates();
  const [currentDate, setCurrentDate] = useState(selectedDate || dates[0].fullDate);

  const handleDateClick = (dateObj) => {
    setCurrentDate(dateObj.fullDate);
    if (onDateChange) {
      onDateChange(dateObj.fullDate);
    }
  };

  return (
    <div className="date-selector">     
      <div className="date-list">
      <LanguageSwitcher />  
        {dates.map((dateObj, index) => (
          <button
             key={index}
             className={`date-item ${currentDate === dateObj.fullDate ? 'active' : ''}`}
             onClick={() => handleDateClick(dateObj)}
           >
             <div className="date-month-day">{t('dateObj.day')}/{t('dateObj.month')}</div>
             <div className="date-day">{dateObj.dayName}</div>  
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateSelector;
