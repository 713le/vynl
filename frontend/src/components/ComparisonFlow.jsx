/**
 * ComparisonFlow.jsx - Binary search comparison engine (Beli-inspired)
 * 
 * Algorithm Overview:
 * - Compares the new album against existing rated albums in the same sentiment category
 * - Uses binary search: picks strategic comparison targets to narrow down position
 * - After each comparison (user picks winner), range narrows until position is determined
 * - Final position determines the album's score within its category
 * - Automatically redistributes scores for all albums in the category for consistency
 * 
 * Phases:
 * 1. vsTop: Compare against highest-rated album
 * 2. vsBottom: Compare against lowest-rated album
 * 3. binary: Narrow search window using midpoint comparisons
 * 4. complete: Show final rating and close modal
 * 
 * API: Uses axios via setRating() to save scores to backend
 */

import React, { useState, useMemo, useEffect } from 'react'
import { CATEGORIES, setRating } from '../utils/ratings'

export default function ComparisonFlow({ newAlbum, existingAlbums, onComplete, sentiment, userId }) {
  // Current phase of the algorithm - determines which album to compare against
  const [phase, setPhase] = useState('init') // init, vsTop, vsBottom, binary, complete
  
  // Search window for binary search phase: { low: index, high: index }
  // Represents range of albums to continue searching within
  const [searchWindow, setSearchWindow] = useState({ low: 0, high: 0 })
  
  // Final score calculated for new album (displayed at end)
  const [newAlbumScore, setNewAlbumScore] = useState(CATEGORIES[sentiment]?.initial || 10.0)

  /**
   * Sort existing albums by score (highest first) for comparison targeting
   * Filter out the album being rated to avoid self-comparison
   * Memoized for performance
   */
  const sortedAlbums = useMemo(() => {
    return [...existingAlbums]
      .filter(a => (a.album_id || a.id) !== newAlbum.id)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
  }, [existingAlbums, newAlbum.id])

  // Get category score boundaries (min and max allowed score for this sentiment)
  const { min: floor, max: ceiling } = CATEGORIES[sentiment] || { min: 0, max: 10 }

  /**
   * Redistribute scores across all albums in the tier for consistency
   * 
   * Scoring rules:
   * - 1 album: gets ceiling score
   * - 2-4 albums: 1.0 point gaps (ceiling, ceiling-1, ceiling-2, etc)
   * - 5+ albums: linear interpolation across full range
   * 
   * Example with "liked" (6.7-10.0):
   * - 3 albums: 10.0, 9.0, 8.0
   * - 5 albums: 10.0, 8.825, 7.65, 6.475 (but min 6.7), 6.7
   */
  const redistributeScores = (albums) => {
    const total = albums.length
    if (total === 0) return {}

    const scores = {}
    
    // CASE 1: Single album - give it the max score for this category
    if (total === 1) {
      const id = albums[0].album_id || albums[0].id
      scores[id] = ceiling
      return scores
    }
    
    // CASE 2: Small list (2-4 albums) - use 1.0 point gaps
    if (total < 5) {
      // Step is always 1.0, but never go below floor (minimum for category)
      for (let i = 0; i < total; ++i) {
        const id = albums[i].album_id || albums[i].id
        const score = Math.max(ceiling - i * 1.0, floor)
        scores[id] = score
      }
      return scores
    }
    
    // CASE 3: Large list (5+ albums) - spread evenly across full range
    const step = (ceiling - floor) / (total - 1)
    for (let i = 0; i < total; ++i) {
      const id = albums[i].album_id || albums[i].id
      scores[id] = ceiling - (i * step)
    }
    return scores
  }

  /**
   * Insert new album at a specific position and save all scores
   * 
   * Process:
   * 1. Create new sorted list with new album inserted at insertIndex
   * 2. Calculate new scores for all albums using redistributeScores()
   * 3. Make API calls (via axios in setRating) to save each album's new score
   * 4. Update UI to show completion screen
   */
  const insertAt = async (insertIndex) => {
    // Build final sorted list with new album at specified position
    const allAlbums = [
      ...sortedAlbums.slice(0, insertIndex).map(a => ({ ...a, isNew: false })),
      { album_id: newAlbum.id, album: newAlbum, isNew: true },
      ...sortedAlbums.slice(insertIndex).map(a => ({ ...a, isNew: false }))
    ]
    
    // Calculate new scores for all albums in this category
    const scores = redistributeScores(allAlbums)

    // Save each album's new score to backend (using axios via setRating)
    for (const album of allAlbums) {
      const id = album.isNew ? newAlbum.id : album.album_id
      const score = scores[id]
      const albumData = album.isNew ? newAlbum : album.album
      // setRating uses axios POST to /api/ratings endpoint
      await setRating(userId, id, albumData, score, album.note || '')
    }

    // Show completion screen with final score
    setNewAlbumScore(scores[newAlbum.id])
    setPhase('complete')
  }

  /**
   * Initialize comparison algorithm on mount
   * Determines starting phase based on number of existing albums
   */
  useEffect(() => {
    if (existingAlbums.length === 0) {
      // Edge case: No existing albums - shouldn't reach here but handle it
      onComplete(ceiling)
      return
    }

    if (existingAlbums.length === 1) {
      // With 1 album, skip to vs bottom (compare against the only album)
      setPhase('vsBottom')
      return
    }

    // With 2+ albums, start by comparing against the best (highest-rated)
    setPhase('vsTop')
  }, [])

  /**
   * Handle user choice during comparison phases
   * Updates phase or search window based on result
   */
  const handleChoice = async (choice) => {
    if (phase === 'vsTop') {
      if (choice === 'new') {
        // User prefers new album over #1 → new album is best in category
        await insertAt(0)
      } else {
        // User prefers existing #1
        if (sortedAlbums.length === 1) {
          // Only 1 existing album, so new goes right after it
          await insertAt(1)
        } else {
          // Multiple existing, move to comparing against worst
          setPhase('vsBottom')
        }
      }
    } 
    else if (phase === 'vsBottom') {
      if (choice === 'existing') {
        // User prefers the worst album over new → new is worst
        await insertAt(sortedAlbums.length)
      } else {
        // User prefers new over worst album
        if (sortedAlbums.length === 2) {
          // Only 2 existing albums, new goes in middle
          await insertAt(1)
        } else {
          // Multiple albums, narrow search to middle range
          // Exclude the top and bottom we already compared
          setSearchWindow({ low: 1, high: sortedAlbums.length - 2 })
          setPhase('binary')
        }
      }
    } 
    else if (phase === 'binary') {
      // Binary search phase - each comparison narrows the window
      const { low, high } = searchWindow
      const mid = Math.floor((low + high) / 2)

      if (choice === 'new') {
        // New album is better than midpoint, search upper half
        const newHigh = mid - 1
        if (newHigh < low) {
          // Search window closed - found insertion point
          await insertAt(mid)
        } else {
          // Continue searching narrower range
          setSearchWindow({ low, high: newHigh })
        }
      } else {
        // New album is worse than midpoint, search lower half
        const newLow = mid + 1
        if (newLow > high) {
          // Search window closed - found insertion point
          await insertAt(mid + 1)
        } else {
          // Continue searching narrower range
          setSearchWindow({ low: newLow, high })
        }
      }
    }
  }

  /**
   * Handle user selecting "They're tied"
   * Inserts new album at same position as current comparison
   */
  const handleTie = async () => {
    if (phase === 'vsTop') {
      // Tie with #1 - insert at position 0 to share ceiling score
      await insertAt(0)
    } else if (phase === 'vsBottom') {
      // Tie with last - insert at last position to share score
      await insertAt(sortedAlbums.length - 1)
    } else if (phase === 'binary') {
      // Tie with midpoint - insert at midpoint
      const { low, high } = searchWindow
      const mid = Math.floor((low + high) / 2)
      await insertAt(mid)
    }
  }

  /**
   * Get the album to compare against in current phase
   * Different logic for each phase
   */
  const getCurrentAlbum = () => {
    if (phase === 'vsTop') return sortedAlbums[0]                    // Best album
    if (phase === 'vsBottom') return sortedAlbums[sortedAlbums.length - 1]  // Worst album
    if (phase === 'binary') {
      const { low, high } = searchWindow
      const mid = Math.floor((low + high) / 2)                       // Midpoint
      return sortedAlbums[mid]
    }
    return null
  }

  const currentAlbum = getCurrentAlbum()

  // Show completion screen after final insertion
  if (phase === 'complete') {
    return (
      <section style={{ marginTop: 20, padding: 12, background: '#f9f9f9', border: '1px solid #000' }}>
        <h3>All set! 👌</h3>
        <p>
          <strong>{newAlbum.title}</strong> has been rated <strong>{newAlbumScore.toFixed(1)}</strong>.
        </p>
        <button onClick={() => onComplete(newAlbumScore)} style={{ marginTop: 10, background: '#ff8c42', border: '1px solid #000', padding: '8px 16px' }}>
          Done
        </button>
      </section>
    )
  }

  // Safety check - shouldn't reach here
  if (existingAlbums.length === 0) {
    return null
  }

  // Main comparison UI - two album cards side by side
  return (
    <section style={{ marginTop: 20, padding: 12, background: '#f9f9f9', border: '1px solid #000' }}>
      <h3>Which do you prefer?</h3>

      {/* Two-column grid with new album on left, existing album on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {/* NEW ALBUM BUTTON */}
        <button
          onClick={() => handleChoice('new')}
          style={{
            padding: 12,
            border: '2px solid transparent',
            background: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#0a74da'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
        >
          <img
            src={newAlbum.artworkUrl || newAlbum.album?.artworkUrl}
            alt={newAlbum.title || newAlbum.album?.title}
            style={{ width: 100, height: 100 }}
          />
          <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
            {newAlbum.title || newAlbum.album?.title}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666' }}>
            {newAlbum.artist || newAlbum.album?.artist}
          </p>
        </button>

        {/* EXISTING ALBUM BUTTON (varies by phase) */}
        <button
          onClick={() => handleChoice('existing')}
          style={{
            padding: 12,
            border: '2px solid transparent',
            background: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#0a74da'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
        >
          <img
            src={currentAlbum?.album?.artworkUrl}
            alt={currentAlbum?.album?.title}
            style={{ width: 100, height: 100 }}
          />
          <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
            {currentAlbum?.album?.title}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666' }}>
            {currentAlbum?.album?.artist}
          </p>
        </button>
      </div>

      {/* Tie button - centers below album comparison */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          onClick={handleTie}
          style={{
            background: '#fff1cd',
            border: '1px solid #000',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          They're tied
        </button>
      </div>
    </section>
  )
}