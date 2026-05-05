/**
 * App.jsx - Root component with routing configuration
 * 
 * Responsibilities:
 * - Set up React Router with all app routes (discover, profile, albums, admin, etc.)
 * - Manage auth state via localStorage (userId, isAdmin flag)
 * - Show Landing page for logged-out users, Discover/pages for logged-in users
 * - Conditionally show Navbar only for authenticated users
 * - Restrict admin routes and other protected pages to logged-in users
 * - Listen for login events to update auth state across browser tabs/windows
 */

import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import Discover from './pages/Discover'
import AlbumDetail from './pages/AlbumDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Followers from './pages/Followers'
import Following from './pages/Following'
import FindFriends from './pages/FindFriends'
import UserProfile from './pages/UserProfile'
import Admin from './pages/Admin'

/**
 * Landing Component - Entry point for logged-out users
 * Shows app intro with Sign Up and Log In buttons
 */
function Landing() {
  return (
    <main className="landing-page">
      <div className="landing-content">
        <div className="landing-logo">💿</div>
        <h1 className="landing-title">Vynl</h1>
        <p className="landing-tagline">Rate and compare your favorite albums</p>
        <div className="landing-actions">
          <Link to="/signup" className="btn btn-primary">
            Sign up
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Log in
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  // Search state passed to Discover page via navbar
  const [searchValue, setSearchValue] = useState('')
  
  // Initialize userId from browser localStorage on app load
  // This allows users to stay logged in across page refreshes
  const [userId, setUserId] = useState(localStorage.getItem('userId'))

  // Listen for custom 'userLoggedIn' event dispatched by Login.jsx
  // Updates auth state when user logs in, enabling instant page visibility updates
  useEffect(() => {
    const handleLogin = () => {
      setUserId(localStorage.getItem('userId'))
    }
    window.addEventListener('userLoggedIn', handleLogin)
    return () => window.removeEventListener('userLoggedIn', handleLogin)
  }, [])

  // Derived auth flags from localStorage
  const isLoggedIn = Boolean(userId)
  const isAdmin = localStorage.getItem('isAdmin')

  return (
    <BrowserRouter>
      {/* Navbar only shown to logged-in users (contains search, profile menu) */}
      {isLoggedIn && <Navbar searchValue={searchValue} onSearchChange={setSearchValue} />}
      
      <Routes>
        {/* Auth Routes - Public pages */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        
        {/* Root Route - Landing for logged-out users, Discover for logged-in users */}
        <Route path="/" element={isLoggedIn ? <Discover searchValue={searchValue} /> : <Landing />} />
        
        {/* Protected Routes - Redirect to landing if not logged in */}
        <Route path="/album/:id" element={isLoggedIn ? <AlbumDetail /> : <Navigate to="/" />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/" />} />
        <Route path="/followers/:userId" element={isLoggedIn ? <Followers /> : <Navigate to="/" />} />
        <Route path="/following/:userId" element={isLoggedIn ? <Following /> : <Navigate to="/" />} />
        <Route path="/find-friends" element={isLoggedIn ? <FindFriends /> : <Navigate to="/" />} />
        <Route path="/user/:userId" element={isLoggedIn ? <UserProfile /> : <Navigate to="/" />} />
        
        {/* Admin Route - Only accessible if logged in AND user has admin flag set to 't' in database */}
        <Route path="/admin" element={isLoggedIn && isAdmin === 't' ? <Admin /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}