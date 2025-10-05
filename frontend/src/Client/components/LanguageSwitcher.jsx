import React from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng); 
  };

  return (
    <div className="lang-toggle">
      <button
        className={`lang-btn ${i18n.language === "vi" ? "active" : ""}`}
        onClick={() => changeLanguage("vi")}
      >
        VI
      </button>
      <button
        className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
        onClick={() => changeLanguage("en")}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
