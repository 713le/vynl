/**
 * itunes.js - External iTunes API integration
 * 
 * This module fetches album data from Apple's iTunes API:
 * - searchAlbums: Search for albums by title/artist
 * - lookupAlbum: Get detailed album info including track listing
 * 
 * Used throughout the app for real-time album discovery and details.
 */

import axios from 'axios'

const BASE = 'https://itunes.apple.com'

export async function searchAlbums(term) {
  const q = encodeURIComponent(term)
  const res = await axios.get(`${BASE}/search?term=${q}&entity=album&limit=25`)
  const results = res.data.results || []
  return results.map(r => ({
    id: String(r.collectionId),
    artworkUrl: r.artworkUrl100?.replace('100x100bb', '400x400bb') || '',
    title: r.collectionName,
    artist: r.artistName,
    year: r.releaseDate ? new Date(r.releaseDate).getFullYear() : undefined,
  }))
}

export async function lookupAlbum(id) {
  const res = await axios.get(`${BASE}/lookup?id=${encodeURIComponent(id)}&entity=song`)
  const results = res.data.results || []
  const albumMeta = results.find(r => r.wrapperType === 'collection')
  const tracks = results.filter(r => r.wrapperType === 'track')
  if (!albumMeta) return null
  return {
    id: String(albumMeta.collectionId),
    artworkUrl: albumMeta.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
    title: albumMeta.collectionName,
    artist: albumMeta.artistName,
    year: albumMeta.releaseDate ? new Date(albumMeta.releaseDate).getFullYear() : undefined,
    tracks: tracks.map(t => ({ id: t.trackId, title: t.trackName, trackNumber: t.trackNumber, previewUrl: t.previewUrl }))
  }
}
