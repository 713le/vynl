/**
 * Discover.jsx - Main album discovery page
 * 
 * Features:
 * - Browse "popular" albums by default when page loads
 * - Search albums in real-time via iTunes API based on navbar search input
 * - Display results in a grid of album cards
 * - Loading states and empty state handling
 */

import React, { useState, useEffect } from 'react'
import AlbumCard from '../components/AlbumCard'
import { searchAlbums } from '../api/itunes'
import './Discover.css'

export default function Discover({ searchValue }) {
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchValue.trim()) {
      setIsLoading(true)
      setIsSearching(true)
      searchAlbums(searchValue)
        .then(results => {
          setSearchResults(results)
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Search error:', err)
          setIsLoading(false)
        })
    } else {
      setIsSearching(false)
      setSearchResults([])
      // Fetch popular albums from iTunes instead of mock data
      setIsLoading(true)
      searchAlbums('popular')
        .then(results => {
          setSearchResults(results.slice(0, 6)) // Show 6 random albums
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Error fetching popular albums:', err)
          setIsLoading(false)
        })
    }
  }, [searchValue])

  const displayAlbums = searchResults

  return (
    <div className="discover-page">
      <header className="discover-header">
        <h1>{isSearching ? 'Search Results' : 'Discover'}</h1>
        <p>{isSearching ? `Results for "${searchValue}"` : 'Explore curated albums'}</p>
      </header>
      <div className="albums-grid">
        {isLoading ? (
          <p className="loading">Loading...</p>
        ) : displayAlbums.length > 0 ? (
          displayAlbums.map(album => (
            <AlbumCard key={album.id} album={album} />
          ))
        ) : (
          <p className="no-results">
            {isSearching ? `No albums found matching "${searchValue}"` : 'No albums available'}
          </p>
        )}
      </div>
    </div>
  )
}
