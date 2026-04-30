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

// Landing page with Sign up and Log in options
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
  const [searchValue, setSearchValue] = useState('')
  const [userId, setUserId] = useState(localStorage.getItem('userId'))

  useEffect(() => {
    // Listen for custom event when user logs in
    const handleLogin = () => {
      setUserId(localStorage.getItem('userId'))
    }
    window.addEventListener('userLoggedIn', handleLogin)
    return () => window.removeEventListener('userLoggedIn', handleLogin)
  }, [])

  const isLoggedIn = Boolean(userId)
  const isAdmin = localStorage.getItem('isAdmin')

  return (
    <BrowserRouter>
      {isLoggedIn && <Navbar searchValue={searchValue} onSearchChange={setSearchValue} />}
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isLoggedIn ? <Discover searchValue={searchValue} /> : <Landing />} />
        <Route path="/album/:id" element={isLoggedIn ? <AlbumDetail /> : <Navigate to="/" />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/" />} />
        <Route path="/followers/:userId" element={isLoggedIn ? <Followers /> : <Navigate to="/" />} />
        <Route path="/following/:userId" element={isLoggedIn ? <Following /> : <Navigate to="/" />} />
        <Route path="/find-friends" element={isLoggedIn ? <FindFriends /> : <Navigate to="/" />} />
        <Route path="/user/:userId" element={isLoggedIn ? <UserProfile /> : <Navigate to="/" />} />
        <Route path="/admin" element={isLoggedIn&&(isAdmin==='t')?<Admin/>:<Navigate to="/"/>}/>
      </Routes>
    </BrowserRouter>
  )
}