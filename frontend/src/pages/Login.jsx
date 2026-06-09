/**
 * Login.jsx - User authentication page
 * 
 * Features:
 * - Accept username and password
 * - Validate against backend API
 * - Store user ID and admin status in localStorage
 * - Dispatch custom event to notify app of login
 * - Redirect to home page on success
 * - Show error messages for invalid credentials
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/login', {
        username,
        password
      })
      localStorage.setItem('userId', res.data.id)
      const p = await axios.get(`/api/users/${res.data.id}`)
      localStorage.setItem('isAdmin',p.data.admin?'t':'f')
      window.dispatchEvent(new Event('userLoggedIn'))
      nav('/')
    } catch (err) {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">💿</div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Log in to continue</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              className="form-input"
              placeholder="Enter your username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className="form-input"
              placeholder="Enter your password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </main>
  )
}