/**
 * RatingFlow.jsx - Step-by-step rating workflow for new/updated ratings
 * 
 * User Flow:
 * 1. Choose sentiment: "I liked it" / "It was ok" / "I didn't like it"
 * 2. Choose comparing method:
 *    - If no existing ratings in that category: use initial score directly
 *    - If few ratings: quick comparisons vs top/bottom albums
 *    - If many: binary search through existing ratings for precise positioning
 * 3. Optional: Add a note/review
 * 4. Save rating with calculated score
 * 
 * Uses axios (via setRating) to make API calls to backend
 */

import React, { useState, useMemo } from 'react'
import ComparisonFlow from './ComparisonFlow'
import { setRating, getAllRatings, CATEGORIES, getCategoryFromScore } from '../utils/ratings'
import './RatingFlow.css'

export default function RatingFlow({ album, existingRatings, onComplete, userId }) {
  // Track which sentiment user selected (liked, ok, or disliked)
  const [sentiment, setSentiment] = useState(null)
  // Optional user note/review for this rating
  const [note, setNote] = useState('')
  // Whether we're currently in the comparison flow (binary search step)
  const [inComparison, setInComparison] = useState(false)

  // UI labels for each sentiment option showing score range for that category
  const sentimentLabels = {
    liked: { label: 'I liked it', description: `${CATEGORIES.liked.min.toFixed(1)} - ${CATEGORIES.liked.max}` },
    ok: { label: 'It was ok', description: `${CATEGORIES.ok.min.toFixed(1)} - ${CATEGORIES.ok.max}` },
    disliked: { label: "I didn't like it", description: `${CATEGORIES.disliked.min} - ${CATEGORIES.disliked.max.toFixed(1)}` }
  }

  // Update sentiment state when user clicks a button
  const handleSentimentChoice = (choice) => {
    setSentiment(choice)
  }

  /**
   * Filter existing ratings to only those in the selected sentiment category
   * This determines which albums to compare against during the binary search
   * Memoized to prevent unnecessary recalculations during re-renders
   */
  const categoryRatings = useMemo(() => {
    if (!sentiment) return []
    return existingRatings.filter(r => {
      // If rating has explicit category field, use it
      if (r.category) return r.category === sentiment
      // For older ratings without category field, infer from score
      const score = r.score || 0
      if (sentiment === 'liked') return score >= 6.7
      if (sentiment === 'ok') return score >= 3.7 && score < 6.7
      if (sentiment === 'disliked') return score < 3.7
      return false
    })
  }, [existingRatings, sentiment])

  /**
   * Handler for when comparison flow completes
   * Saves the final calculated score to the backend via axios
   * Then calls parent's onComplete callback to close the modal
   */
  const handleComparisonComplete = async (finalScore) => {
    // setRating uses axios to POST to /api/ratings endpoint
    await setRating(userId, album.id, album, finalScore, note)
    onComplete(finalScore, note)
  }

  // Update note state as user types
  const handleNoteChange = (e) => {
    setNote(e.target.value)
  }

  /**
   * Main flow decision logic when user clicks "Done"
   * 
   * Two paths:
   * 1. No existing ratings in category → use initial score for sentiment, save immediately
   * 2. Has existing ratings → launch ComparisonFlow for binary search positioning
   */
  const handleDone = () => {
    if (!sentiment) return

    // CASE 1: First album in this sentiment category
    if (categoryRatings.length === 0) {
      const initialScore = CATEGORIES[sentiment].initial
      // Directly save with initial score (liked: 10.0, ok: 6.6, disliked: 3.6)
      handleComparisonComplete(initialScore)
    } else {
      // CASE 2: Existing albums - need to compare to find position
      setInComparison(true)
    }
  }

  // If user is in comparison flow, render ComparisonFlow component instead
  if (inComparison) {
    return (
      <ComparisonFlow
        newAlbum={album}
        existingAlbums={categoryRatings}  // Albums to compare against (same sentiment)
        onComplete={handleComparisonComplete}
        sentiment={sentiment}
        userId={userId}
      />
    )
  }

  // Main UI: Sentiment selection + optional note
  return (
    <section className="rating-flow">
      <h2>Rate "{album.title}"</h2>
      
      <div className="sentiment-section">
        <h3>How did you feel about this album?</h3>
        <div className="sentiment-buttons">
          {/* Render 3 sentiment buttons showing score ranges for each category */}
          {Object.entries(sentimentLabels).map(([key, val]) => (
            <button
              key={key}
              onClick={() => handleSentimentChoice(key)}
              className={`sentiment-button ${key} ${sentiment === key ? 'active' : ''}`}
            >
              <div className="sentiment-label">{val.label}</div>
              <div className="sentiment-description">{val.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Optional note section */}
      <div className="note-section">
        <label htmlFor="rating-note" className="note-label">Add a note (optional)</label>
        <textarea
          id="rating-note"
          className="note-textarea"
          placeholder="What did you think about this album? Favorite tracks? Any thoughts..."
          value={note}
          onChange={handleNoteChange}
          rows={4}
        />
      </div>

      {/* Done button enabled only after sentiment selection */}
      <div className="button-group">
        {sentiment && (
          <button
            onClick={handleDone}
            className="submit-button"
          >
            Done
          </button>
        )}
      </div>
    </section>
  )
}