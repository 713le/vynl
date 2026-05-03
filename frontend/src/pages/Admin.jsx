import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import profile from '../data/vynl-profile.png'
import './Profile.css'

export default function Admin() {
  const nav = useNavigate()
  const userId = localStorage.getItem('userId')
  const [screen,setScreen] = useState('users')
  const [users,setUsers] = useState([])
  const [chosenUser,setChosenUser] = useState(null)
  const [ratings,setRatings] = useState([])

  useEffect(() => {
    updateUsers()
  }, [userId])

  async function updateUsers(){
    if (userId) {
        try{
        const res = await fetch('http://localhost:3000/api/admin/users',{
            headers:{'Content-Type': 'application/json','adminid':userId}})
        const data = await res.json()
        setUsers(data)}
      catch (err) {
      console.error('error getting users')
    }
    }
  }
async function deleteUser(id){
    const confirm = window.confirm("Delete user and all their ratings?")
    if(confirm){
        await fetch(`http://localhost:3000/api/admin/users/${id}`,{
            method: 'DELETE', headers:{'Content-Type': 'application/json','adminid':userId}})
        setUsers(users.filter(n=>n.id!==id))
        //setRatings(ratings.filter(n=>n.user_id!==id))
    }
}
async function getRatings(user){
    try{
        const res = await fetch(`http://localhost:3000/api/admin/users/${user.id}/ratings`,{
            headers:{'Content-Type': 'application/json','adminid':userId}})
        const data = await res.json()
        setRatings(data)
        setChosenUser(user)
        setScreen('ratings')
    }
    catch(err){
        console.error('error getting user ratings')
    }
}
async function deleteRating(uId,rId){
    try{
        const res = await fetch(`http://localhost:3000/api/admin/users/${uId}/ratings/${rId}`,{
            method: 'DELETE', headers:{'Content-Type': 'application/json','adminid':userId}})
        setRatings(ratings.filter(n=>n.id!==rId))
    }
    catch(err){
        console.error('error deleting rating')
    }
}
async function deleteNote(uId,rId){
    try{
        const res = await fetch(`http://localhost:3000/api/admin/users/${uId}/ratings/${rId}/note`,{
            method: 'DELETE', headers:{'Content-Type': 'application/json','adminid':userId}})
        setRatings(ratings.map(r=>r.id===rId?{...r,note:null}:r))
    }
    catch(err){
        console.error('error deleting rating')
    }
}


  return (
    <main className="profile-page">
          <header className="profile-header">
            {/* <img className="profile-photo" src={profile} alt="Admin" /> */}
            <div className="profile-meta">
              <h2>Admin Dashboard</h2>
            <p className="profile-bio">View Users and Ratings</p>
                      <div className="profile-stats">
                        <div><strong>{users.length}</strong><div>Users</div></div>

                      </div>
                    </div>
                  </header>
    
    {screen === 'users'&&(
        <section className="ratings-feed">
            <h3 className="activity-title">All Users</h3>
        {users.length === 0 && <p className="empty">No users</p>}
        {users.map(user=>(
            <article key={user.id} className="rating-item" onClick={()=>getRatings(user)}>
                <img src={profile} alt={user.username} className='rating-art'/>
                <div className="rating-body">
                    <p className="rating-title">{user.username}</p>
                    <p className="rating-artist">{user.email}</p>
                    <p className="rating-score">{user.admin?'Admin':'User'}</p>
                </div>
                <div className="rating-actions">
                    <button className="remove-btn" onClick={(e) => {e.stopPropagation();deleteUser(user.id) }}>Delete User</button>
                </div>
            </article>

        ))}
        </section>

    )}
    {screen === 'ratings'&&(
        <section className="ratings-feed">
            <button className="back-btn" onClick={()=>{setScreen('users')
                                    setChosenUser(null)
                                    setRatings([])}}>VIEW OTHER USERS</button>
            <h3 className="activity-title">{chosenUser.username}'s ratings</h3>
        {ratings.length === 0 && <p className="empty">No ratings found</p>}
        {ratings.map(r=>(
            <article key={r.id} className="rating-item">
                <img src={r.album.artworkUrl} alt={r.album.title} className='rating-art'/>
                <div className="rating-body">
                    <p className="rating-title">{r.album.title}</p>
                    <p className="rating-artist">{r.album.artist}</p>
                    <p className="rating-score">Score: {(r.score||0).toFixed(1)}</p>
                    {r.note&&<p className="rating-note">{r.note}</p>}
                </div>
                <div className="rating-actions">
                    <button className="remove-btn" onClick={() => {deleteRating(chosenUser.id,r.id) }}>Delete Rating</button>
                    {r.note&&(
                        <button className="remove-btn" onClick={()=>deleteNote(chosenUser.id,r.id)}>
                        Delete Note
                        </button>
                    )}
                </div>
            </article>

        ))}
        </section>
        
    )}</main>
  )
}
