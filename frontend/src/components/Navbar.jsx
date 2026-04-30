import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import profile from '../data/vynl-profile.png'
import './Navbar.css'

export default function Navbar({ searchValue, onSearchChange }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const userId = localStorage.getItem('userId')
  const isAdmin = localStorage.getItem('isAdmin')

  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:3000/api/users/${userId}`)
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(err => console.error('Failed to fetch user:', err))
    }
  }, [userId])

  const handleSearch = (value) => {
    onSearchChange(value)
    if (value.trim()) {
      navigate('/')
    }
  }

  const handleHomeClick = () => {
    onSearchChange('')
    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('isAdmin')
    window.location.href = '/'
  }

  return (
    <nav className="navbar">
      <button onClick={handleHomeClick} className="navbar-panel navbar-logo">
        Vynl
      </button>

      <div className="navbar-panel navbar-search">
        <SearchBar value={searchValue} onChange={handleSearch} />
      </div>

      <div className="navbar-profile-container">
        <button 
          className="navbar-panel navbar-profile"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img
            src={profile}
            alt="Profile"
            className="profile-image"
          />
          <span className="profile-username">{user?.username || 'Loading...'}</span>
          <span className="profile-chevron" aria-hidden="true">
            ▼
          </span>
        </button>
        
        {dropdownOpen && (
          <div className="profile-dropdown">
            <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
              PROFILE
            </Link>
            {isAdmin==='t'&&(
            <Link to="/admin" className="dropdown-item" onClick={()=>setDropdownOpen(false)}>
              ADMIN
            </Link>
            )}
            <button className="dropdown-item" onClick={handleLogout}>
              LOG OUT
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
