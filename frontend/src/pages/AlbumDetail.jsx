/**
 * AlbumDetail.jsx - Individual album detail page with rating interface
 * 
 * Features:
 * - Display album metadata (artwork, title, artist, track listing)
 * - Show existing user rating if album was already rated
 * - Launch RatingFlow modal for new or edited ratings
 * - Support Beli-style binary search comparison for better ranking
 * - Track all user ratings to calculate positions in ranked list
 */

import React, { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { lookupAlbum } from '../api/itunes'
import Rating from '../components/Rating'
import RatingFlow from '../components/RatingFlow'
import { getRating, setRating, getAllRatings } from '../utils/ratings'
import './AlbumDetail.css'

export default function AlbumDetail() {
  const { id } = useParams()
  const location = useLocation()
  const userId = localStorage.getItem('userId')
  const { data: album, isLoading } = useQuery(['album', id], () => lookupAlbum(id), { enabled: Boolean(id) })
  const [ratingInProgress, setRatingInProgress] = useState(false)
  const [ratings, setRatings] = useState(null)
  const [existing, setExisting] = useState(null)
  const [allRatings, setAllRatings] = useState([])

  useEffect(() => {
    if (location.state?.startRating) {
      setRatingInProgress(true)
    }
  }, [location.state])

  useEffect(() => {
    if (userId) {
      getRating(userId, album?.id).then(setExisting)
      getAllRatings(userId).then(setAllRatings)
    }
  }, [userId, album?.id])

  if (isLoading) return <main className="album-detail"><div className="loading">Loading…</div></main>
  if (!album) return <main className="album-detail"><Link to="/" className="back-link">← Back</Link><p>Album not found</p></main>

  const handleRatingComplete = async (score, note) => {
    const category = score >= 6.7 ? 'liked' : score >= 3.7 ? 'ok' : 'disliked'
    await setRating(userId, album.id, { id: album.id, title: album.title, artist: album.artist, artworkUrl: album.artworkUrl }, score, note)
    setRatingInProgress(false)
    setRatings({ myRating: score, note })
  }

  const displayRating = ratings?.myRating ?? existing?.score
  const displayNote = ratings?.note ?? existing?.note

  return (
    <main className="album-detail">
      <Link to="/" className="back-link">← Back</Link>
      
      {ratingInProgress && (
        <div className="rating-modal-overlay">
          <div className="rating-modal">
            <button className="modal-close" onClick={() => setRatingInProgress(false)}>×</button>
            <RatingFlow
              album={album}
              existingRatings={allRatings}
              onComplete={handleRatingComplete}
              userId={userId}
            />
          </div>
        </div>
      )}

      <div className="album-container">
        <div className="album-art-section">
          <img src={album.artworkUrl} alt={album.title} className="album-art-large" />
        </div>

        <div className="album-info-section">
          <h1 className="album-title">{album.title}</h1>
          <p className="album-artist">{album.artist}</p>
          {album.year && <p className="album-year">{album.year}</p>}

          <div className="ratings-section">
            <div className="rating-item">
              <p className="rating-label">My Rating</p>
              <Rating value={displayRating} />
              {displayNote && <p className="rating-note">{displayNote}</p>}
            </div>
            <div className="rating-item">
              <p className="rating-label">Friend Rating</p>
              <p className="friend-rating">— (Coming soon)</p>
            </div>
          </div>

          {!ratingInProgress && (
            <button
              onClick={() => setRatingInProgress(true)}
              className="rate-album-button"
            >
              {displayRating ? 'Edit Rating' : 'Rate Album'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
