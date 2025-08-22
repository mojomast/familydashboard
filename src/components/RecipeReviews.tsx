import React, { useState, useEffect } from 'react';
import type { Recipe, RecipeReview, UserProfile, MealHistory } from '../types';
import { createDAL } from '../lib/dal';

interface RecipeReviewsProps {
  recipe: Recipe;
  familyMembers: UserProfile[];
  mealHistory: MealHistory[];
  currentUserId?: string;
  onReviewAdded?: (review: RecipeReview) => void;
  onReviewUpdated?: (review: RecipeReview) => void;
}

const REVIEW_TAGS = [
  'Delicious', 'Easy to make', 'Family favorite', 'Healthy', 'Quick',
  'Great texture', 'Perfect seasoning', 'Kid-friendly', 'Crowd pleaser',
  'Make again', 'Too salty', 'Needs more flavor', 'Dry', 'Too sweet',
  'Great presentation', 'Good value', 'Nutritious', 'Creative', 'Traditional'
];

export const RecipeReviews: React.FC<RecipeReviewsProps> = ({
  recipe,
  familyMembers,
  mealHistory,
  currentUserId,
  onReviewAdded,
  onReviewUpdated
}) => {
  const [reviews, setReviews] = useState<RecipeReview[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<RecipeReview | null>(null);
  const [loading, setLoading] = useState(true);
  const dal = createDAL();

  useEffect(() => {
    loadReviews();
  }, [recipe.id]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [recipeReviews, avgRating] = await Promise.all([
        dal.getRecipeReviews(recipe.id),
        dal.getAverageRating(recipe.id)
      ]);
      setReviews(recipeReviews);
      setAverageRating(avgRating);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (reviewData: Omit<RecipeReview, 'id' | 'recipeId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUserId) return;

    try {
      const newReview = await dal.createRecipeReview({
        ...reviewData,
        recipeId: recipe.id,
        reviewerId: currentUserId,
      });

      setReviews(prev => [newReview, ...prev]);
      await loadReviews(); // Refresh to get updated average
      setIsAddingReview(false);
      onReviewAdded?.(newReview);
    } catch (err) {
      console.error('Failed to add review:', err);
    }
  };

  const handleUpdateReview = async (reviewData: Partial<RecipeReview>) => {
    if (!editingReview) return;

    try {
      const updatedReview = await dal.updateRecipeReview(editingReview.id, reviewData);
      setReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
      await loadReviews(); // Refresh to get updated average
      setEditingReview(null);
      onReviewUpdated?.(updatedReview);
    } catch (err) {
      console.error('Failed to update review:', err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await dal.deleteRecipeReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      await loadReviews(); // Refresh to get updated average
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={interactive && onRate ? () => onRate(star) : undefined}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const ReviewForm: React.FC<{
    review?: RecipeReview | null;
    onSave: (data: Omit<RecipeReview, 'id' | 'recipeId' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
  }> = ({ review, onSave, onCancel }) => {
    const [rating, setRating] = useState(review?.rating || 5);
    const [title, setTitle] = useState(review?.title || '');
    const [reviewText, setReviewText] = useState(review?.review || '');
    const [wouldMakeAgain, setWouldMakeAgain] = useState(review?.wouldMakeAgain ?? true);
    const [improvements, setImprovements] = useState(review?.improvements || '');
    const [selectedTags, setSelectedTags] = useState<string[]>(review?.tags || []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUserId) return;

      onSave({
        reviewerId: currentUserId,
        rating,
        title: title.trim() || undefined,
        review: reviewText.trim(),
        wouldMakeAgain,
        improvements: improvements.trim() || undefined,
        tags: selectedTags,
        mealHistoryId: review?.mealHistoryId,
      });
    };

    const toggleTag = (tag: string) => {
      setSelectedTags(prev =>
        prev.includes(tag)
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      );
    };

    return (
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label>Rating *</label>
          {renderStars(rating, true, setRating)}
        </div>

        <div className="form-group">
          <label>Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief title for your review"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Review *</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your thoughts about this recipe..."
            rows={4}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={wouldMakeAgain}
              onChange={(e) => setWouldMakeAgain(e.target.checked)}
            />
            Would you make this again?
          </label>
        </div>

        <div className="form-group">
          <label>Suggestions for improvement (Optional)</label>
          <textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="Any changes you'd make next time?"
            rows={3}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-selector">
            {REVIEW_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {review ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    );
  };

  const getReviewerName = (reviewerId: string) => {
    const member = familyMembers.find(m => m.id === reviewerId);
    return member?.name || 'Unknown';
  };

  const getReviewerAvatar = (reviewerId: string) => {
    const member = familyMembers.find(m => m.id === reviewerId);
    return member?.avatar || '👤';
  };

  if (loading) {
    return <div className="loading">Loading reviews...</div>;
  }

  return (
    <div className="recipe-reviews">
      <div className="reviews-header">
        <div className="rating-summary">
          <div className="average-rating">
            {averageRating !== null ? (
              <>
                <div className="big-stars">{renderStars(averageRating)}</div>
                <div className="rating-info">
                  <span className="average-score">{averageRating}</span>
                  <span className="review-count">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                </div>
              </>
            ) : (
              <div className="no-reviews">No reviews yet</div>
            )}
          </div>
        </div>

        {currentUserId && (
          <button
            onClick={() => setIsAddingReview(true)}
            className="btn-primary"
          >
            Write Review
          </button>
        )}
      </div>

      {/* Add Review Modal */}
      {isAddingReview && (
        <div className="modal-overlay">
          <div className="modal-content review-modal">
            <h3>Write a Review for {recipe.name}</h3>
            <ReviewForm
              onSave={handleAddReview}
              onCancel={() => setIsAddingReview(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="modal-overlay">
          <div className="modal-content review-modal">
            <h3>Edit Review for {recipe.name}</h3>
            <ReviewForm
              review={editingReview}
              onSave={handleUpdateReview}
              onCancel={() => setEditingReview(null)}
            />
          </div>
        </div>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="empty-state">
            <p>No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-avatar">{getReviewerAvatar(review.reviewerId)}</span>
                  <div className="reviewer-details">
                    <span className="reviewer-name">{getReviewerName(review.reviewerId)}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
              </div>

              {review.title && (
                <h4 className="review-title">{review.title}</h4>
              )}

              <p className="review-text">{review.review}</p>

              {review.tags.length > 0 && (
                <div className="review-tags">
                  {review.tags.map(tag => (
                    <span key={tag} className="review-tag">{tag}</span>
                  ))}
                </div>
              )}

              <div className="review-footer">
                <div className="review-meta">
                  {review.wouldMakeAgain ? (
                    <span className="would-make-again yes">Would make again</span>
                  ) : (
                    <span className="would-make-again no">Would not make again</span>
                  )}
                </div>

                {currentUserId === review.reviewerId && (
                  <div className="review-actions">
                    <button
                      onClick={() => setEditingReview(review)}
                      className="btn-sm btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {review.improvements && (
                <div className="review-improvements">
                  <strong>Suggestions:</strong> {review.improvements}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecipeReviews;