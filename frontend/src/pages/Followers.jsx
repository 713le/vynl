import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import './Followers.css'

export default function Followers() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('userId')
  const [followers, setFollowers] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Fetch the user's info
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error('Failed to fetch user:', err))

    // Fetch followers
    fetch(`/api/followers/${userId}`)
      .then(res => res.json())
      .then(data => setFollowers(data))
      .catch(err => console.error('Failed to fetch followers:', err))
  }, [userId])

  return (
    <main className="followers-page">
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      
      <h1>{user?.username}'s Followers</h1>
      
      {followers.length === 0 ? (
        <p className="empty">No followers yet.</p>
      ) : (
        <ul className="user-list">
          {followers.map(follower => (
            <li key={follower.id} className="user-item">
              <Link to={`/user/${follower.id}`} className="user-link">
                <span className="user-avatar">👤</span>
                <span className="user-name">{follower.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}