/**
 * ratings.js - API wrapper and configuration for the rating system
 * 
 * Responsibilities:
 * - Export CATEGORIES config (liked/ok/disliked with score ranges)
 * - Provide axios-based API wrappers for rating CRUD operations
 * - Utility functions for score-to-category conversion and display
 * 
 * Note: The binary search algorithm for comparing albums is implemented in ComparisonFlow.jsx
 * Score redistribution logic is in ComparisonFlow.jsx's redistributeScores() function
 */

import axios from 'axios'

const API_BASE = ''

/**
 * Rating categories configuration
 * Defines score ranges for each sentiment tier and initial scores
 * Used by RatingFlow to display category labels and ranges
 */
export const CATEGORIES = {
  liked: { label: 'I liked it', min: 6.7, max: 10.0, initial: 10.0 },
  ok: { label: 'It was ok', min: 3.7, max: 6.6, initial: 6.6 },
  disliked: { label: "I didn't like it", min: 0.0, max: 3.6, initial: 3.6 }
}

/**
 * Convert a score (0-10) to its category
 * Used by setRating() to tag ratings with their sentiment category
 */
export function getCategoryFromScore(score) {
  if (score >= CATEGORIES.liked.min) return 'liked'
  if (score >= CATEGORIES.ok.min) return 'ok'
  return 'disliked'
}

/**
 * Get display score from a rating object
 * Safely extracts score with fallback to 0
 * Used by Profile.jsx and Rating.jsx
 */
export function getDisplayScore(rating) {
  return rating?.score ?? 0
}

// API functions
export async function setRating(userId, albumId, albumMeta, score, note = '') {
  try {
    const category = getCategoryFromScore(score)
    await axios.post(`${API_BASE}/api/ratings`, {
      userId,
      albumId,
      score,
      note,
      category,
      album: albumMeta
    })
    window.dispatchEvent(new CustomEvent('ratingsChanged'))
  } catch (err) {
    console.error('Failed to save rating:', err)
  }
}

export async function getRating(userId, albumId) {
  try {
    const res = await axios.get(`${API_BASE}/api/ratings/${userId}`)
    return res.data.find(r => r.album_id === albumId) || null
  } catch (err) {
    console.error('Failed to fetch rating:', err)
    return null
  }
}

export async function getAllRatings(userId) {
  try {
    const res = await axios.get(`${API_BASE}/api/ratings/${userId}`)
    return res.data.sort((a, b) => (b.score || 0) - (a.score || 0))
  } catch (err) {
    console.error('Failed to fetch ratings:', err)
    return []
  }
}

export async function getRatingsByCategory(userId, category) {
  try {
    const res = await axios.get(`${API_BASE}/api/ratings/${userId}`)
    return res.data
      .filter(r => r.category === category)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
  } catch (err) {
    console.error('Failed to fetch ratings by category:', err)
    return []
  }
}

export async function removeRating(userId, albumId) {
  try {
    await axios.delete(`${API_BASE}/api/ratings/${userId}/${albumId}`)
    window.dispatchEvent(new CustomEvent('ratingsChanged'))
  } catch (err) {
    console.error('Failed to delete rating:', err)
  }
}