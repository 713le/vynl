# Vynl

## Project Overview
Vynl is a social music ranking app that lets users search for albums, rate music, and build a personalized ranked listening log. Its purpose is to help listeners compare opinions, follow friends, and keep a persistent rating history with album details.

## Team Members & Roles
- Angelina Le – Frontend / UX Design
- Tian Hao Sheng – Server / Backend
- Ryan Hammond – Database

## Application Features
- **User Accounts & Roles**: Users can sign up and log in. The app is designed to support user roles, including standard users and an admin role for deleting users and ratings/notes. 
- **Database Storage**: Data is stored in PostgreSQL hosted on Supabase, including user profiles, album ratings, and follower relationships.
- **Interactive UI**: Built with React, the frontend includes dynamic search, forms, live data updates, and responsive navigation.
- **New Library / Framework**: The project uses modern tools such as Vite, React Router, Axios, and TanStack React Query.
- **Internal REST API**: The backend exposes REST endpoints for authentication, ratings, user profiles, followers, and searching.
- **External REST API**: The app integrates with the iTunes API for album search and metadata.

## Installation & Setup Instructions
1. Clone the repository.
2. Install frontend dependencies:
   - `cd frontend`
   - `npm install`
3. Install backend dependencies:
   - `cd ../server`
   - `npm install`
4. Create and configure your PostgreSQL database.
5. Start the backend server:
   - `npm run dev`
6. Start the frontend:
   - `cd ../frontend`
   - `npm run dev`

## API Keys & Database Setup
Create a `.env` file inside `server/` with the following variables:
- `POSTGRES_HOST=your_database_host`
- `POSTGRES_PORT=5432`
- `POSTGRES_DBNAME=your_database_name`
- `POSTGRES_USERNAME=your_username`
- `POSTGRES_PASSWORD=your_password`

No external API key is required for the current iTunes integration. 