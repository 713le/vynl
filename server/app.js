import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import bcrypt from 'bcrypt'
import pg from 'pg'

const app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.json())
app.use(cors())

const { Pool } = pg
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DBNAME,
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD
})

const query = (text, params) => pool.query(text, params)

// Create followers table if it doesn't exist
const initDb = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS followers (
      id SERIAL PRIMARY KEY,
      follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id)
    )
  `)
  await query(`CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id)`)
}
initDb()

// Health check
app.get('/up', (_req, res) => res.json({ status: 'up' }))

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    // Handle signup: hash password (bcrypt), create user in DB
    const { username, email, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, hashedPassword]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  // Handle login: verify credentials, return JWT or session
  try {
    const { username, password } = req.body
    const result = await query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1',
      [username]
    )
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' })
    res.json({ id: user.id, username: user.username, email: user.email })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

// Rating endpoints
app.post('/api/ratings', async (req, res) => {
  // Save rating to db
  try {
    const { userId, albumId, score, note, album, category } = req.body
    // Convert score to number explicitly
    const scoreNum = Number(score)
    const result = await query(
      'INSERT INTO ratings (user_id, album_id, score, rating, note, album_data, category) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id, album_id) DO UPDATE SET score = $3, rating = $4, note = $5, album_data = $6, category = $7, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [userId, albumId, scoreNum, String(scoreNum), note, album, category]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('Rating error:', err.message)
    res.status(500).json({ error: 'Failed to save rating' })
  }
})

app.get('/api/ratings/:userId', async (req, res) => {
  // Fetch all the user ratings
  try {
    const { userId } = req.params
    const result = await query(
      'SELECT id, album_id, score, note, album_data, category, updated_at FROM ratings WHERE user_id = $1 ORDER BY score DESC',
      [userId]
    )
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

<<<<<<< HEAD
async function isAdmin(id){
  try{
    if(!id){
      return false
    }
    const result = await query('SELECT admin FROM users where id = $1',[id]) 
    if(!result.rows[0].admin){
      return false
    }
    return true
  }
  catch(err){
    return false
  }
  
}
app.get('/api/admin/users', async(req,res)=>{
  //fetch all users from db
  try{
    const adminId  = req.headers['adminid']
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
app.delete('/api/admin/users/:userId', async(req,res)=>{
  try{
    const adminId  = req.headers['adminid']
    const { userId } = req.params
    if(await isAdmin(adminId)){
      await query('DELETE FROM ratings WHERE user_id = $1',[userId])
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
app.get('/api/admin/users/:userId/ratings', async (req, res) => {
  // get ratings for user
  try {
    const adminId  = req.headers['adminid']
     const { userId } = req.params
    if(await isAdmin(adminId)){
      const result = await query(
      'SELECT id, album_id, score, note, album_data, category, updated_at FROM ratings WHERE user_id = $1 ORDER BY score DESC',
      [userId]
    )
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

=======
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
>>>>>>> 2c2bcaf (updated readme)

// Error handling
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(app.get('port'), () => {
  console.log(`Server running on http://localhost:${app.get('port')}`)
})

export default app