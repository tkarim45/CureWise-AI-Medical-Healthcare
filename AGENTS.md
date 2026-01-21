# CureWise AI - Agent Development Guide

This guide provides essential information for AI agents working on the CureWise AI Medical Healthcare platform.

## Project Overview

CureWise is a full-stack AI-powered healthcare platform built with:
- **Backend**: FastAPI (Python 3.9) with PostgreSQL
- **Frontend**: React 19 with Tailwind CSS and Framer Motion
- **AI/ML**: LangChain ecosystem with multiple LLMs (Gemini, Llama, Groq)
- **Database**: PostgreSQL with raw psycopg2 connections (no ORM)
- **Containerization**: Docker with docker-compose

## Development Commands

### Frontend (React)
```bash
cd frontend
npm start                    # Start development server (localhost:3000)
npm run build               # Build for production
npm test                    # Run all tests in watch mode
npm test -- --watchAll=false # Run tests once
npm test -- --testPathPattern=filename  # Run single test file
npm test -- --testNamePattern="test name"  # Run tests matching pattern
```

### Backend (FastAPI)
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000  # Start dev server
pip install -r requirements.txt    # Install dependencies
python -m pytest                  # Run tests (when implemented)
```

### Docker Development
```bash
docker-compose up --build          # Start all services
docker-compose up backend          # Start only backend
docker-compose up frontend         # Start only frontend
docker-compose down                 # Stop all services
```

## Code Style Guidelines

### Frontend (JavaScript/React)

#### Import Organization
```javascript
// React and core libraries first
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Third-party libraries
import { motion } from "framer-motion";
import axios from "axios";
import { FaUser, FaHeart } from "react-icons/fa";

// Local imports (absolute paths from src/)
import NavBar from "../components/layout/NavBar";
import { AuthProvider } from "../context/AuthContext";
import { healthFeatures } from "../data/dashboardData";
```

#### Component Structure
```javascript
// Use functional components with hooks
const ComponentName = ({ prop1, prop2 }) => {
  // 1. State and hooks first
  const [state, setState] = useState(null);
  const navigate = useNavigate();
  
  // 2. Event handlers
  const handleClick = () => { /* ... */ };
  
  // 3. Effects
  useEffect(() => { /* ... */ }, []);
  
  // 4. Helper functions
  const helperFunction = () => { /* ... */ };
  
  // 5. JSX return
  return (
    <div className="p-4">
      {/* Content */}
    </div>
  );
};

export default ComponentName;
```

#### Naming Conventions
- **Components**: PascalCase (UserProfile, DashboardPage)
- **Files**: ComponentName.js (matching component name)
- **Variables**: camelCase (userData, isActive)
- **Constants**: UPPER_SNAKE_CASE (API_BASE_URL)
- **CSS Classes**: Tailwind utility classes only

#### Styling Guidelines
- Use Tailwind CSS utility classes exclusively
- Responsive design: `sm: md: lg: xl:` prefixes
- Custom colors defined in tailwind.config.js
- Use semantic HTML5 elements
- Add proper ARIA labels for accessibility

### Backend (Python)

#### Import Organization
```python
# Standard library
import logging
import uuid
from datetime import datetime
from typing import List, Optional

# Third-party
from fastapi import FastAPI, HTTPException, Depends
import psycopg2
from pydantic import BaseModel

# Local imports
from config.settings import settings
from models.schemas import UserCreate, UserResponse
from utils.db import get_db_connection
```

#### Code Structure
```python
# 1. Imports
# 2. Configuration and constants
# 3. Pydantic models/schemas
# 4. Utility functions
# 5. API route handlers
# 6. Main application setup
```

#### Naming Conventions
- **Functions**: snake_case (get_user_by_id, create_appointment)
- **Variables**: snake_case (user_data, is_active)
- **Constants**: UPPER_SNAKE_CASE (API_BASE_URL, MAX_RETRIES)
- **Classes**: PascalCase (UserCreate, DatabaseManager)
- **Files**: snake_case.py (user_routes.py, database.py)

#### API Route Patterns
```python
from fastapi import APIRouter, Depends, HTTPException
router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db_connection)
):
    """Get list of users with pagination."""
    try:
        # Implementation
        return users
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

## Error Handling

### Frontend Error Handling
```javascript
// API calls with try-catch
const fetchData = async () => {
  try {
    const response = await axios.get('/api/data');
    setData(response.data);
  } catch (error) {
    console.error('API Error:', error);
    // Show user-friendly error message
    setError('Failed to load data. Please try again.');
  }
};

// React Error Boundaries (implement for components)
class ErrorBoundary extends React.Component {
  // Implementation
}
```

### Backend Error Handling
```python
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

try:
    # Database operation
    result = await database_operation()
except psycopg2.Error as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(status_code=500, detail="Database operation failed")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

## Testing Guidelines

### Frontend Testing
```javascript
// Use React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('user can login successfully', async () => {
  render(<LoginPage />);
  
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /login/i });
  
  await userEvent.type(emailInput, 'user@example.com');
  await userEvent.type(passwordInput, 'password123');
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
```

### Backend Testing (pytest - when implemented)
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_user():
    response = client.post("/api/users", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 201
    assert response.json()["username"] == "testuser"
```

## Database Patterns

### Connection Management
```python
# Use context managers for database connections
async def get_db_connection():
    conn = await psycopg2.connect(settings.DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

# Always close connections
async def execute_query(query: str, params: tuple = None):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            return await cur.fetchall()
```

## Security Best Practices

### Authentication
- JWT tokens with proper expiration
- Hash passwords with bcrypt
- Validate all inputs with Pydantic schemas
- Use HTTPS in production
- Implement rate limiting for sensitive endpoints

### Frontend Security
- Never store sensitive data in localStorage
- Validate user inputs on both client and server
- Use environment variables for API URLs
- Implement proper CORS configuration

## Development Environment

### Required Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key
GOOGLE_API_KEY=your-google-api-key
GROQ_API_KEY=your-groq-api-key

# Frontend (.env)
REACT_APP_API_URL=http://localhost:8000
```

### Local Development Setup
1. Clone repository
2. Install Python dependencies: `pip install -r backend/requirements.txt`
3. Install Node dependencies: `npm install` (in frontend/)
4. Start PostgreSQL database
5. Run backend: `uvicorn main:app --reload`
6. Run frontend: `npm start`
7. Or use Docker: `docker-compose up --build`

## Code Quality Tools

### Current Configuration
- **Frontend ESLint**: react-app preset with `no-unused-vars: warn`
- **Testing**: Jest with React Testing Library
- **Styling**: Tailwind CSS with custom configuration

### Recommended Improvements
- Add Prettier for code formatting
- Implement TypeScript for type safety
- Add pytest for backend testing
- Configure pre-commit hooks
- Add code coverage reporting

## File Organization

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (NavBar, Footer)
│   └── ui/             # UI components (Button, Modal)
├── context/           # React Context providers
├── pages/             # Page-level components
├── utils/             # Utility functions
├── data/              # Static data/constants
└── assets/            # Images, fonts, etc.
```

### Backend Structure
```
├── config/            # Configuration and settings
├── models/            # Pydantic schemas
├── routes/            # API route handlers
├── utils/             # Business logic and utilities
├── tests/             # Test files
└── main.py            # FastAPI application entry point
```

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `refactor/description` - Code refactoring

### Commit Messages
- Use present tense: "Add user authentication" not "Added user authentication"
- Keep under 50 characters for subject line
- Add detailed body if needed

## Performance Considerations

### Frontend Optimization
- Use React.memo for expensive components
- Implement proper loading states
- Lazy load routes with React.lazy()
- Optimize images and assets
- Use useCallback and useMemo appropriately

### Backend Optimization
- Use async/await for I/O operations
- Implement database connection pooling
- Add proper indexing for frequently queried columns
- Use pagination for large datasets
- Cache frequently accessed data

## AI/ML Integration

### LangChain Usage
- Use appropriate chain types for different tasks
- Handle LLM API rate limits gracefully
- Implement fallback mechanisms
- Log AI responses for monitoring
- Validate AI outputs before processing

### Model Management
- Store model configurations in environment
- Implement model versioning
- Monitor model performance and costs
- Handle model errors gracefully