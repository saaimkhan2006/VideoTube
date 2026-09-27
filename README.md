# 🎬 VideoTube — Full-Stack Video Streaming & Community Platform

VideoTube is a production-grade, full-stack video hosting, streaming, and social interaction platform built with Node.js, Express, MongoDB, and React. Inspired by YouTube, it features JWT-based user authentication, media processing pipelines via Multer and Cloudinary, MongoDB aggregation pipelines, channel analytics, community posts (tweets), playlists, and real-time interaction systems (likes, comments, subscriptions).

---

## 🚀 Key Features

### 🔐 Authentication & User Management
- **Secure Authentication**: JWT-based Access and Refresh Token architecture with HTTP-only cookies and Bearer headers.
- **Password Security**: Salted password hashing with `bcrypt`.
- **Channel Profiles**: User profile customization including avatar and cover image uploads, password updates, subscriber counts, and watch history tracking.

### 📹 Video Pipeline & Cloud Storage
- **Media Upload Pipeline**: Handles video files and thumbnail uploads using `multer` with disk storage and automatic cleanup of local temporary files upon successful remote upload.
- **Cloud Media Storage**: Integrated with **Cloudinary** for scalable video hosting and adaptive thumbnail delivery.
- **Video Management**: Publish/unpublish toggles, metadata editing (title, description, duration), and automated Cloudinary asset deletion when videos are removed.

### 💬 Social Interactions & Community Features
- **Like System**: Polymorphic like toggling for videos, comments, and community tweets.
- **Comments**: Full CRUD operations on video comments with pagination.
- **Subscriptions**: Real-time channel subscription and subscriber tracking.
- **Playlists**: Custom playlist creation, updating, and video management.
- **Community Tweets**: Micro-blogging / community tab posts for channel updates.

### 📊 Creator Studio & Analytics
- **Channel Dashboard**: Comprehensive metrics including total video views, total subscribers, total likes, and published video status.
- **Search & Pagination**: Dynamic video query filtering (title, description, tags), sorting, and pagination powered by `mongoose-aggregate-paginate-v2`.

---

## 🛠️ Tech Stack

| Domain | Tech / Tools Used |
| :--- | :--- |
| **Frontend** | React.js, Vite, TailwindCSS, React Router, Axios |
| **Backend** | Node.js, Express.js (v5), JavaScript (ES Modules) |
| **Database** | MongoDB, Mongoose ODM (`mongoose-aggregate-paginate-v2`) |
| **Media & Storage** | Cloudinary API, Multer |
| **Auth & Security** | JSON Web Tokens (JWT), Bcrypt, Cookie Parser, CORS |

---

## 📁 Repository Structure

```text
VideoTube/
├── backend/                        # Backend REST API
│   ├── src/
│   │   ├── controllers/            # Request handlers (User, Video, Like, Comment, Playlist, etc.)
│   │   ├── db/                     # MongoDB connection setup
│   │   ├── middlewares/            # Auth and Multer upload middleware
│   │   ├── models/                 # Mongoose database schemas
│   │   ├── routes/                 # Express API routes
│   │   ├── utils/                  # ApiError, ApiResponse, asyncHandler, Cloudinary handler
│   │   ├── app.js                  # Express app setup & middleware configuration
│   │   ├── constants.js            # Global backend constants
│   │   └── index.js                # Server entry point
│   ├── public/temp/                # Temporary local storage for uploaded media
│   ├── .env                        # Backend environment variables
│   └── package.json
├── frontend/                       # React + Vite Frontend App
│   ├── src/                        # Components, Pages, State management, API clients
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json                    # Root workspace package file (monorepo scripts)
└── README.md                       # Main project documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v18+`
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Cloudinary Account**: Cloud Name, API Key, and API Secret

### Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=8000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Installation & Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/VideoTube.git
   cd VideoTube
   ```

2. **Run Backend API**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Run Frontend Client** (in a new terminal tab):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🛰️ Main API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/users/register` | Register a new user with avatar & cover image |
| `POST` | `/api/v1/users/login` | User login (returns access & refresh tokens) |
| `POST` | `/api/v1/users/logout` | User logout (clears tokens) |
| `GET` | `/api/v1/videos` | Fetch paginated videos with search & filter params |
| `POST` | `/api/v1/videos` | Upload video & thumbnail to Cloudinary |
| `GET` | `/api/v1/videos/:videoId` | Get video by ID & increment view count |
| `POST` | `/api/v1/likes/toggle/v/:videoId` | Toggle like on a video |
| `POST` | `/api/v1/subscriptions/c/:channelId` | Toggle subscription to a channel |
| `GET` | `/api/v1/dashboard/stats` | Fetch channel analytics (views, subscribers, total likes) |

---

## 📜 License

This project is licensed under the ISC License.
