/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { createReview } from '../../../services/reviewService';
import styles from './ReviewForm.module.css';
import { useTranslation } from 'react-i18next';

const ReviewForm = ({ movieId, onReviewAdded }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      setError(t('Please enter your name'));
      return;
    }
    
    if (rating === 0) {
      setError(t('Please select a rating'));
      return;
    }
    
    if (!comment.trim()) {
      setError(t('Please enter your comment'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const reviewData = {
        movieId: movieId,
        userId: userName.trim(),
        userName: userName.trim(),
        rating: rating,
        comment: comment.trim(),
        likes: 0,
        dislikes: 0
      };
      
      const newReview = await createReview(reviewData);
      console.log('Review created successfully:', newReview);
      
      setSuccess(t('Your review has been submitted successfully!'));
      setRating(0);
      setComment('');
      setUserName('');
      
      if (onReviewAdded) {
        setTimeout(() => {
          onReviewAdded();
        }, 2000);
      }    
    } catch (error) {
      setError(t('An error occurred while submitting your review. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles['review-form-container']}`}>
      <h3 className={`${styles['review-form-title']}`}>{t('Write your review ')}</h3>
      
      <form onSubmit={handleSubmit} className={`${styles['review-form']}`}>
        <div className={`${styles['form-group']}`}>
          <label htmlFor="userName" className={`${styles['form-label']}`}>
            {t('Your name')} *
          </label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className={`${styles['form-input']}`}
            placeholder={t("Enter your name")}
            maxLength={50}
          />
        </div>

        <div className={`${styles['form-group']}`}>
          <label className={`${styles['form-label']}`}>
            {t('Rating score')} *
          </label>
          <div className={`${styles['rating-container']}`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles['rating-star']} ${star <= rating ? styles['active'] : ''}`} 
                onClick={() => handleRatingClick(star)}
                disabled={isSubmitting}
              >
                <Star size={24} fill={star <= rating ? '#fbbf24' : 'none'} />
              </button>
            ))}
            <span className={`${styles['rating-text']}`}>
              {rating > 0 ? `${rating}/5 star` : t('Select review score')}
            </span>
          </div>
        </div>

        <div className={`${styles['form-group']}`}>
          <label htmlFor="comment" className={`${styles['form-label']}`}>
            {t('Comment')} *
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`${styles['form-textarea']}`}
            placeholder= {t("Share your thoughts about this movie...")}
            rows={4}
            maxLength={500}
          />
          <div className={`${styles['character-count']}`}>
            {comment.length}/{t('500 characters max')}
          </div>
        </div>

        {error && (
          <div className={`${styles['message']} ${styles['error-message']}`}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={`${styles['message']} ${styles['success-message']}`}>
            {success}
          </div>
        )}

        <button
          type="submit"
          className={`${styles['submit-button']}`}
          disabled={isSubmitting || rating === 0 || !comment.trim() || !userName.trim()}
        >
          {isSubmitting ? (
            <>
              <div className={`${styles['loading-spinner']}`}></div>
              {t('Sending...')}
            </>
          ) : (
            <>
              <Send size={16} />
              {t('Submit a review')}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
