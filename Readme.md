Here's a README file for your VideoTube backend project:

---

# VideoTube Backend

This is the backend server for the VideoTube application, a platform for uploading, storing, and streaming videos. The server is built with Node.js and Express.js, and it integrates with various services and libraries to provide a robust and secure API for the frontend.

## Table of Contents
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Technologies Used

- **Node.js**: JavaScript runtime for building the backend.
- **Express.js**: Web framework for Node.js.
- **MongoDB & Mongoose**: NoSQL database and ORM for managing application data.
- **JWT (jsonwebtoken)**: For secure user authentication.
- **Bcrypt**: For hashing user passwords.
- **Multer**: Middleware for handling file uploads.
- **Cloudinary**: Cloud service for managing media files.
- **Cookie-Parser**: Middleware for parsing cookies.
- **CORS**: Middleware for enabling Cross-Origin Resource Sharing.
- **Dotenv**: For managing environment variables.
- **Nodemon**: Tool for automatically restarting the server during development.
- **Prettier**: Code formatter to maintain a consistent code style.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rythm-sachdeva/backendpro.git
   cd videotube-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root of your project and add the required environment variables. Refer to the [Environment Variables](#environment-variables) section for more details.

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Usage

Once the server is running, it will be available at `http://localhost:8000` (or the port specified in your `.env` file). You can interact with the API using tools like Postman or connect it to your frontend.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=8000
MONGO_URI=your_mongo_db_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## API Endpoints

Here's the updated API Endpoints section of your README file with the correct routes:

---

## API Endpoints

### Authentication
- **POST** `/api/v1/user/login` - Login a user.
- **POST** `/api/v1/user/logout` - Logout a user (Requires JWT verification).
- **POST** `/api/v1/user/refresh-token` - Refresh the access token.

### User Management
- **POST** `/api/v1/user/change-password` - Change the current user's password (Requires JWT verification).
- **GET** `/api/v1/user/current-user` - Get the current logged-in user's details (Requires JWT verification).
- **PATCH** `/api/v1/user/update-account` - Update the current user's account details (Requires JWT verification).
- **PATCH** `/api/v1/user/avatar` - Update the current user's avatar (Requires JWT verification, uses multer for file upload).
- **PATCH** `/api/v1/user/cover-image` - Update the current user's cover image (Requires JWT verification, uses multer for file upload).
- **GET** `/api/v1/user/c/:username` - Get a user's channel profile (Requires JWT verification).

### Watch History
- **GET** `/api/v1/user/watch-history` - Get the current user's watch history (Requires JWT verification).


## Testing

Testing has been carried out using **Postman** to ensure the reliability and correctness of the API endpoints. The tests include creating, retrieving, updating, and deleting resources (e.g., users and videos).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.


 