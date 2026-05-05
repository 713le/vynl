// imports
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import bcrypt from 'bcrypt'
import pg from 'pg'

// express definition, cors, port
const app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.json())
app.use(cors())

// db connection and config
const { Pool } = pg
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DBNAME,
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD
})

// this helper is useful for SQL query execution
const query = (text, params) => pool.query(text, params)

// Create followers table if it doesn't exist
const initDb = async () => {
  // dont allow duplicate followers
  await query(`
    CREATE TABLE IF NOT EXISTS followers (
      id SERIAL PRIMARY KEY,
      follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id)
    )
  `)
  // creating indexes for faster lookups
  await query(`CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id)`)
}
initDb()

// Health check
app.get('/up', (_req, res) => res.json({ status: 'up' }))

// Auth endpoints
// for creating a new user account
app.post('/api/auth/signup', async (req, res) => {
  try {
    // handle signup: hash password using bcrypt
    const { username, email, password } = req.body
    // 10 salt rounds for security
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, hashedPassword]
    )
    // return the new user data
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' })
  }
})

// authentication of user and credentials
app.post('/api/auth/login', async (req, res) => {
  // handle login: verify credentials, return JWT or session
  try {
    const { username, password } = req.body
    // fetch from db
    const result = await query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1',
      [username]
    )
    const user = result.rows[0]
    // existence check
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    // verify password by comparing with stored hash
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' })
    // very important that we dont send the password hash to the client
    res.json({ id: user.id, username: user.username, email: user.email })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

// Rating endpoints
// for new ratings
app.post('/api/ratings', async (req, res) => {
  // Save rating to db
  try {
    const { userId, albumId, score, note, album, category } = req.body
    // convert score to number explicitly to make sure its numeric
    const scoreNum = Number(score)
    // either insert or update
    const result = await query(
      'INSERT INTO ratings (user_id, album_id, score, rating, note, album_data, category) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id, album_id) DO UPDATE SET score = $3, rating = $4, note = $5, album_data = $6, category = $7, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [userId, albumId, scoreNum, String(scoreNum), note, album, category]
    )
    // returns the complete rating object with the id and time stamps
    // the time stamps are used for the user profile
    res.json(result.rows[0])
  } catch (err) {
    console.error('Rating error:', err.message)
    res.status(500).json({ error: 'Failed to save rating' })
  }
})

// get all the ratings for a specific user
app.get('/api/ratings/:userId', async (req, res) => {
  // Fetch all the user ratings
  try {
    const { userId } = req.params
    // we assume the user exists and fetch the ratings for them
    // the res is ordered by score descending
    const result = await query(
      'SELECT id, album_id, score, note, album_data, category, updated_at FROM ratings WHERE user_id = $1 ORDER BY score DESC',
      [userId]
    )
    // here to make sure the db results match frontend expected response
    const ratings = result.rows.map(r => ({
      id: r.id,
      album_id: r.album_id,
      score: r.score,
      category: r.category,
      note: r.note,
      album: r.album_data || {},
      updatedAt: r.updated_at  
    }))
    res.json(ratings)
  } catch (err) {
    console.error('Fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch ratings' })
  }
})

// delete a rating for an album
app.delete('/api/ratings/:userId/:albumId', async (req, res) => {
  // Delete an existing rating
  try {
    const { userId, albumId } = req.params
    await query('DELETE FROM ratings WHERE user_id = $1 AND album_id = $2', [userId, albumId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete rating' })
  }
})

// User endpoints
// getting the user id
app.get('/api/users/:userId', async (req, res) => {
  // Fetch user profile from DB
  try {
    const { userId } = req.params
    const result = await query(
      'SELECT id, username, email, admin FROM users WHERE id = $1',
      [userId]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// check if the user has admin privileges
async function isAdmin(id){
  try{
    // id doesn't exist -> no good
    if(!id){
      return false
    }
    // db query for admin status
    const result = await query('SELECT admin FROM users where id = $1',[id]) 
    // no results? -> no good
    if(!result.rows[0].admin){
      return false
    }
    // we assume its true by default unless proven otherwise
    return true
  }
  catch(err){
    return false
  }
  
}

// get the list of all users
app.get('/api/admin/users', async(req,res)=>{
  //fetch all users from db
  try{
    const adminId  = req.headers['adminid']
    // verify admin status
    if(await isAdmin(adminId)) {
      const result = await query('SELECT id, username, email, admin, created_at FROM users ORDER by id')
      res.json(result.rows)
    }
    else{
      res.status(403).json({ error: 'Forbidden' }) 
    }
  }
  catch(err){
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// delete a user via admin permissions
app.delete('/api/admin/users/:userId', async(req,res)=>{
  try{
    const adminId  = req.headers['adminid']
    const { userId } = req.params
    // verify
    if(await isAdmin(adminId)){
      // delete ratings first (cleanup is explicit)
      await query('DELETE FROM ratings WHERE user_id = $1',[userId])
      // delete user (cascading deletes follower relationships, very convenient)
      await query('DELETE FROM users WHERE id = $1',[userId])
      res.json({ success: true })}
    else{
      res.status(403).json({ error: 'Forbidden' }) 
    }
  }
  catch(err){
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// fetch all ratings for a specific user
app.get('/api/admin/users/:userId/ratings', async (req, res) => {
  // get ratings for user
  try {
    const adminId  = req.headers['adminid']
     const { userId } = req.params
     // bla bla verification
    if(await isAdmin(adminId)){
      const result = await query(
      'SELECT id, album_id, score, note, album_data, category, updated_at FROM ratings WHERE user_id = $1 ORDER BY score DESC',
      [userId]
    )
    // similar to fetch ratings for a normal user to match frontend format
      const ratings = result.rows.map(r => ({
      id: r.id,
      album_id: r.album_id,
      score: r.score,
      category: r.category,
      note: r.note,
      album: r.album_data || {},
      updatedAt: r.updated_at  
    }))
    res.json(ratings)
    }
    else{
      res.status(403).json({ error: 'Forbidden' }) 
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings' })
  }
})

app.delete('/api/admin/users/:userId/ratings/:id', async(req,res)=>{
  try{
    //delete a users rating
    const adminId  = req.headers['adminid']
    const { userId, id } = req.params
    if(await isAdmin(adminId)){
      await query('DELETE FROM ratings WHERE user_id = $1 AND id = $2', [userId, id])
      res.json({ success: true })}
    else{
      res.status(403).json({ error: 'Forbidden' }) 
    }
  }
  catch(err){
    res.status(500).json({ error: 'Failed to delete user rating' })
  }
})

app.delete('/api/admin/users/:userId/ratings/:id/note', async(req,res)=>{
  try{
    //delete the note of a rating
    const adminId  = req.headers['adminid']
    const { userId, id } = req.params
    if(await isAdmin(adminId)){
      // set note to NULL without deleting the entire rating
      await query('UPDATE ratings SET note = NULL where user_id = $1 AND id = $2', [userId, id])
      res.json({ success: true })}
    else{
      res.status(403).json({ error: 'Forbidden' }) 
    }
  }
  catch(err){
    res.status(500).json({ error: 'Failed to delete user rating' })
  }
})

// Followers/Following endpoints
app.post('/api/follow/:userId', async (req, res) => {
  // Follow a user
  try {
    const followerId = req.body.followerId
    const followingId = parseInt(req.params.userId)
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }
    await query(
      'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to follow user' })
  }
})

app.delete('/api/follow/:userId', async (req, res) => {
  // Unfollow a user
  try {
    const followerId = req.body.followerId
    const followingId = parseInt(req.params.userId)
    await query('DELETE FROM followers WHERE follower_id = $1 AND following_id = $2', [followerId, followingId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to unfollow user' })
  }
})

app.get('/api/followers/:userId', async (req, res) => {
  // Get followers for a user
  try {
    const { userId } = req.params
    const result = await query(
      `SELECT u.id, u.username FROM users u
       INNER JOIN followers f ON f.follower_id = u.id
       WHERE f.following_id = $1`,
      [userId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch followers' })
  }
})

app.get('/api/following/:userId', async (req, res) => {
  // Get following for a user
  try {
    const { userId } = req.params
    const result = await query(
      `SELECT u.id, u.username FROM users u
       INNER JOIN followers f ON f.following_id = u.id
       WHERE f.follower_id = $1`,
      [userId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch following' })
  }
})

app.get('/api/users/search/:username', async (req, res) => {
  // Search for users by username
  try {
    const { username } = req.params
    const result = await query(
      'SELECT id, username FROM users WHERE username ILIKE $1 LIMIT 20',
      [`%${username}%`]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to search users' })
  }
})

app.get('/api/follow/status/:userId', async (req, res) => {
  // Check if current user follows target user
  try {
    const currentUserId = parseInt(req.query.currentUserId)
    const targetUserId = parseInt(req.params.userId)
    const result = await query(
      'SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2',
      [currentUserId, targetUserId]
    )
    res.json({ isFollowing: result.rows.length > 0 })
  } catch (err) {
    res.status(500).json({ error: 'Failed to check follow status' })
  }
})

// Error handling
// catches all undefined routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// this is the global version, in case an unexpected error is somehow thrown by any of the route handlers
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(app.get('port'), () => {
  console.log(`Server running on http://localhost:${app.get('port')}`)
})

export default app