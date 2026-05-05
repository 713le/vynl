/**
 * main.jsx - Application entry point
 * 
 * Responsibilities:
 * - Initialize React root DOM element
 * - Set up TanStack React Query (QueryClientProvider) for managing server state
 *   Note: React Query is currently used in AlbumDetail.jsx for album lookup caching
 * - Wrap App component with QueryClientProvider to enable useQuery hooks
 * - Global styles.css imported here
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles.css'

/**
 * QueryClient Configuration
 * - Manages caching, synchronization, and deduplication of server state
 * - Prevents redundant API calls by caching responses (default 5 minute stale time)
 * - Used by AlbumDetail.jsx with useQuery(['album', id]) for iTunes lookup caching
 */
const queryClient = new QueryClient()

// Mount React app to #root div in index.html
const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    {/* QueryClientProvider makes queryClient available to all child components via useQuery/useMutation hooks */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
