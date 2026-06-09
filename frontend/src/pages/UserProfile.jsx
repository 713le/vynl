import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import profile from '../data/vynl-profile.png'
import './UserProfile.css'

export default function UserProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('userId')
  const [user, setUser] = useState(null)
  const [ratings, setRatings] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    // Fetch user data
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error('Failed to fetch user:', err))

    // Fetch ratings
    fetch(`/api/ratings/${userId}`)
      .then(res => res.json())
      .then(data => setRatings(data))
      .catch(err => console.error('Failed to fetch ratings:', err))

    // Fetch followers/following counts
    fetch(`/api/followers/${userId}`)
      .then(res => res.json())
      .then(data => setFollowers(data))
      .catch(err => console.error('Failed to fetch followers:', err))
    fetch(`/api/following/${userId}`)
      .then(res => res.json())
      .then(data => setFollowing(data))
      .catch(err => console.error('Failed to fetch following:', err))

    // Check follow status
    if (currentUserId) {
      fetch(`/api/follow/status/${userId}?currentUserId=${currentUserId}`)
        .then(res => res.json())
        .then(data => setIsFollowing(data.isFollowing))
        .catch(err => console.error('Failed to check follow status:', err))
    }
  }, [userId, currentUserId])

  const handleFollow = async () => {
    try {
      await fetch(`/api/follow/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: parseInt(currentUserId) })
      })
      setIsFollowing(true)
      setFollowers(prev => [...prev, { id: parseInt(currentUserId), username: 'You' }])
    } catch (err) {
      console.error('Failed to follow:', err)
    }
  }

  const handleUnfollow = async () => {
    try {
      await fetch(`/api/follow/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: parseInt(currentUserId) })
      })
      setIsFollowing(false)
      setFollowers(prev => prev.filter(f => f.id !== parseInt(currentUserId)))
    } catch (err) {
      console.error('Failed to unfollow:', err)
    }
  }

  return (
    <main className="user-profile-page">
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      
      <header className="profile-header">
        <img className="profile-photo" src={profile} alt="Profile" />
        <div className="profile-meta">
          <h2>{user?.username || 'Loading...'}</h2>
          <p className="profile-bio">Vinyl collector. Rating everything I spin.</p>
          <div className="profile-stats">
            <div><strong>{ratings.length}</strong><div>Ratings</div></div>
            <div><Link to={`/followers/${userId}`}><strong>{followers.length}</strong><div>Followers</div></Link></div>
            <div><Link to={`/following/${userId}`}><strong>{following.length}</strong><div>Following</div></Link></div>
          </div>
        </div>
      </header>

      <div className="profile-actions">
        {isFollowing ? (
          <button className="unfollow-button" onClick={handleUnfollow}>UNFOLLOW</button>
        ) : (
          <button className="follow-button" onClick={handleFollow}>FOLLOW</button>
        )}
      </div>

      <section className="ratings-feed">
        <h3 className="activity-title">Rated Albums</h3>
        {ratings.length === 0 && <p className="empty">This user hasn't rated any albums yet.</p>}

        {ratings.map((r, index) => (
          <article key={r.id} className="rating-item">
            <img src={r.album?.artworkUrl} alt={r.album?.title} className="rating-art" />
            <div className="rating-body">
              <p className="ranked-number">#{index + 1}</p>
              <p className="rating-title">{r.album?.title}</p>
              <p className="rating-artist">{r.album?.artist}</p>
              <p className="rating-score">Score: {(r.score || 0).toFixed(1)}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}