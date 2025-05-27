# Cloud Project

This project consists of a backend and frontend component. Follow the instructions below to set up and run the application.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js) or yarn
- Python 3.8+
- pip (Python package manager)

## Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate

   # On Windows
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   If you don't have a requirements.txt, install the necessary packages manually:
   ```bash
   pip install fastapi uvicorn
   ```

4. **Set up environment variables**:
   Create a `.env` file in the backend directory and add your environment variables:
   ```env
   # Example:
   # DATABASE_URL=your_database_connection_string
   # SECRET_KEY=your_secret_key
   ```

5. **Run the backend server**:
   ```bash
   uvicorn main:app --reload
   ```
   The backend server will start at `http://localhost:8000` by default.

## Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
   (If your frontend is in the root directory, skip this step)

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**:
   Create a `.env` file in the frontend directory if needed:
   ```env
   # Example:
   # REACT_APP_API_URL=http://localhost:8000
   ```

4. **Run the development server**:
   ```bash
   npm start
   # or
   yarn start
   ```
   The frontend will be available at `http://localhost:3000` by default.

## Development Workflow

1. Start the backend server in one terminal
2. Start the frontend development server in another terminal
3. The frontend will automatically reload when you make changes
4. The backend will also reload if you used the `--reload` flag with uvicorn

## Available Scripts

### Backend
- `uvicorn main:app --reload`: Start the development server with auto-reload
- `pytest`: Run backend tests (if configured)

### Frontend
- `npm start`: Start the development server
- `npm test`: Run tests
- `npm run build`: Build for production

## Environment Variables

### Backend
- `PORT`: Port to run the backend server on (default: 8000)
- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: Secret key for authentication (if applicable)

### Frontend
- `REACT_APP_API_URL`: URL of the backend API (default: http://localhost:8000)

## Troubleshooting

- If you encounter dependency issues, try deleting `node_modules` and running `npm install` again
- Make sure all required environment variables are set
- Check that the backend server is running if frontend API calls are failing
- Check the console in your browser's developer tools for frontend errors
- Check the terminal where the backend server is running for backend errors
