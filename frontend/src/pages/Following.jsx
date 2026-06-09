import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import './Followers.css'

export default function Following() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [following, setFollowing] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Fetch the user's info
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error('Failed to fetch user:', err))

    // Fetch following
    fetch(`/api/following/${userId}`)
      .then(res => res.json())
      .then(data => setFollowing(data))
      .catch(err => console.error('Failed to fetch following:', err))
  }, [userId])

  return (
    <main className="followers-page">
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      
      <h1>{user?.username} is Following</h1>
      
      {following.length === 0 ? (
        <p className="empty">Not following anyone yet.</p>
      ) : (
        <ul className="user-list">
          {following.map(followingUser => (
            <li key={followingUser.id} className="user-item">
              <Link to={`/user/${followingUser.id}`} className="user-link">
                <span className="user-avatar">👤</span>
                <span className="user-name">{followingUser.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}