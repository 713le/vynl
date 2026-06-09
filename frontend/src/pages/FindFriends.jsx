import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './FindFriends.css'

export default function FindFriends() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setSearched(true)
    try {
      const res = await fetch(`/api/users/search/${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error('Search failed:', err)
    }
  }

  return (
    <main className="find-friends-page">
      <h1>Find Friends</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">SEARCH</button>
      </form>

      {searched && results.length === 0 && (
        <p className="empty">No users found matching "{query}"</p>
      )}

      {results.length > 0 && (
        <ul className="user-list">
          {results.map(user => (
            <li key={user.id} className="user-item">
              <Link to={`/user/${user.id}`} className="user-link">
                <span className="user-avatar">👤</span>
                <span className="user-name">{user.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}