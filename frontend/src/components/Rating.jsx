/**
 * Rating.jsx - Displays a user's current rating score for an album
 * 
 * Purpose:
 * - Shows the formatted score (0.0 - 10.0) for an album
 * - Listens for rating changes and updates in real-time
 * - Used throughout the app to display user's personal rating
 */

import React, { useState, useEffect } from 'react'
import { getAllRatings, getDisplayScore } from '../utils/ratings'

export default function Rating({ value, userId }) {
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const [allScores, setAllScores] = useState([])

  useEffect(() => {
    const handleRatingsChange = () => {
      setUpdateTrigger(prev => prev + 1)
    }
    window.addEventListener('ratingsChanged', handleRatingsChange)
    return () => window.removeEventListener('ratingsChanged', handleRatingsChange)
  }, [])

  useEffect(() => {
    if (userId) {
      getAllRatings(userId).then(ratings => setAllScores(ratings.map(r => r.score)))
    }
  }, [userId, updateTrigger])

  if (value == null) return <span style={{color:'#888'}}>—</span>
  
  // Use the score directly or calculate from rankings
  const displayScore = value.toFixed(1)

  return <strong style={{color:'#0a74da'}}>Score: {displayScore}</strong>
}