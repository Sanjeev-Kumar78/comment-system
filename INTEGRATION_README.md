# Comment System Integration

This document explains how to use the integrated frontend and backend comment system.

## Overview

The system consists of:

- **Backend**: NestJS API running on port 3001 (in Docker container)
- **Frontend**: React + Vite application running on port 5173
- **Database**: PostgreSQL running in Docker container

## Features

### Authentication

- User registration (signup)
- User login with JWT tokens
- Protected routes requiring authentication

### Comments System

- Create comments
- Reply to comments (nested structure)
- Edit your own comments
- Delete your own comments
- Restore deleted comments
- Real-time comment loading

## Usage

### Getting Started

1. **Backend**: Already running in Docker container on port 3001
2. **Frontend**: Start with `npm run dev` (running on port 5173)

### User Flow

1. **Registration**:

   - Visit http://localhost:5173
   - Click "Sign up" to create a new account
   - Fill in: First Name, Last Name, Email, Password (min 6 chars)

2. **Login**:

   - Use your email and password to log in
   - JWT token is stored in localStorage for session persistence

3. **Using Comments**:
   - After login, you'll see the comments section
   - **Create**: Type in the comment box and click "Post Comment"
   - **Reply**: Click "Reply" on any comment to respond
   - **Edit**: Click "Edit" on your own comments to modify them
   - **Delete**: Click "Delete" on your own comments to remove them
   - **Restore**: Deleted comments show a "Restore" option for the owner

### API Endpoints

#### Authentication

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (protected)

#### Comments

- `GET /comments` - Get all comments
- `POST /comments` - Create new comment (protected)
- `GET /comments/:id` - Get specific comment
- `GET /comments/:id/replies` - Get replies to a comment
- `PUT /comments/:id` - Update comment (protected, owner only)
- `DELETE /comments/:id` - Delete comment (protected, owner only)
- `POST /comments/:id/restore` - Restore deleted comment (protected, owner only)

## Technical Details

### Frontend Stack

- React 19
- TypeScript
- Tailwind CSS v4
- Vite
- Axios for API calls

### Backend Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Docker

### Security Features

- JWT token authentication
- CORS enabled for localhost:5173
- Input validation with class-validator
- User ownership checks for edit/delete operations
- Password hashing (bcrypt)

## Development

### Frontend Development

```bash
cd frontend_comment
npm install
npm run dev
```

### Backend Development

The backend is running in Docker. To see logs:

```bash
docker logs backend_comment-backend-1
```

### Database

PostgreSQL is running in Docker container on port 5433.

## User Interface

The UI features:

- Clean, modern design with Tailwind CSS
- Responsive layout
- Form validation with error messages
- Loading states for better UX
- Nested comment threading with visual indentation
- Real-time updates after actions
- Intuitive navigation between login/signup
