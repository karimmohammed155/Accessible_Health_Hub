# User Management API

## Overview
This API provides user management features including registration, authentication, account activation, password management, and user profile updates. Below are the available endpoints for the frontend team to interact with.

## Base URL
```
http://localhost:3000/user
```

## Endpoints

### Register User
```
POST /register
```
Registers a new user with optional profile image upload.

- **Headers:** None
- **Body (multipart/form-data):**
  - `name` (string)
  - `email` (string)
  - `password` (string)
  - `profileImage` (file, optional)
  - `confirmPassword`(string)
  - `role`(doctor/user,optional)(default=user)

### Login
```
POST /login
```
Authenticates a user and returns a JWT token.

- **Headers:** None
- **Body:**
  - `email` (string)
  - `password` (string)

### Forget Password
```
POST /forgetPassword
```
Initiates the password reset process and sends a reset code via email.

- **Headers:** None
- **Body:**
  - `email` (string)

### Reset Password
```
PUT /resetPassword
```
Resets the user's password using the provided reset code.

- **Headers:** None
- **Body:**
  - `email` (string)
  - `password` (string)
  -  `confirmPassword`(string)
  - `forgetCode` (string)

### Delete User
```
DELETE /deleteUser
```
Deletes the authenticated user's account.

- **Headers:**
  - `token`: Bearer token for authentication

### Update User
```
PUT /updateUser
```
Updates user profile information, including profile image.

- **Headers:**
  - `token`: Bearer token for authentication
- **Body (multipart/form-data):**
  - `name` (string, optional)
  - `profileImage` (file, optional)

## Authentication
All protected routes require a JWT token. Include the token in the request headers as follows:
```
Authorization: Bearer <your_token>
```

######################
## Features
- **User Authentication**: Register, login, password reset, and account management
- **Post Management**: Create, read, update, and delete posts with file uploads
- **Interactions**: Like, rate, and save posts with statistics tracking
- **Comments**: Threaded comments with replies
- **Content Organization**: Categories and sub-categories for content classification
- **Cloud Storage**: Integrated Cloudinary support for media file management

## API Endpoints

### Authentication Requirements
🔒 = Requires authentication  
🔓 = Public access

### User Routes
- `POST /user/register` - Register new user
- `GET /user/activate_account/:token` - Activate account
- `POST /user/login` - User login
- `POST /user/forgetPassword` - Request password reset
- `PUT /user/resetPassword` - Reset password
- `PUT /user/updateUser` - Update user profile
- `DELETE /user/deleteUser` - Delete user account

### Category Routes
| Endpoint | Method | Auth | Description | Request Body |
|----------|--------|------|-------------|--------------|
| `/category/add` | POST | 🔒 | Create new category | `{ name }` |
| `/category/get` | GET | 🔓 | Get categories (filter by ID or name) | Query: `_id?`, `name?` |
| `/category/update/:_id` | PUT | 🔒 | Update category | `{ name }` |
| `/category/delete/:_id` | DELETE | 🔒 | Delete category | - |

### Sub-Category Routes
| Endpoint | Method | Auth | Description | Request Body |
|----------|--------|------|-------------|--------------|
| `/sub_category/add` | POST | 🔒 | Create sub-category | `{ name, category_id }` |
| `/sub_category/get` | GET | 🔓 | Get sub-categories | Query: `_id?`, `name?` |
| `/sub_category/update/:_id` | PUT | 🔒 | Update sub-category | `{ name }` |
| `/sub_category/delete/:_id` | DELETE | 🔒 | Delete sub-category | - |

### Post Routes
| Endpoint | Method | Auth | Description | Request Body |
|----------|--------|------|-------------|--------------|
| `/post/add` | POST | 🔒 | Create new post | `{ title, content, files? }` |
| `/post/list` | GET | 🔓 | Get all posts | - |
| `/post/list_specific/:_id` | GET | 🔓 | Get specific post | - |
| `/post/update/:post_id` | PUT | 🔒 | Update post | `{ title?, content?, files? }` |
| `/post/delete/:post_id` | DELETE | 🔒 | Delete post | - |

### Comment Routes
| Endpoint | Method | Auth | Description | Request Body |
|----------|--------|------|-------------|--------------|
| `/comment/:post_id/add` | POST | 🔒 | Add comment/reply | `{ text, parent_comment_id? }` |
| `/comment/:post_id/get` | GET | 🔓 | Get all comments | - |
| `/comment/:_id/delete` | DELETE | 🔒 | Delete comment | - |

### Interaction Routes
| Endpoint | Method | Auth | Description | Request Body |
|----------|--------|------|-------------|--------------|
| `/interaction/:post_id/like` | POST | 🔒 | Like/unlike post | - |
| `/interaction/:post_id/rate` | POST | 🔒 | Rate post | `{ rating }` |
| `/interaction/:post_id/save` | POST | 🔒 | Save/unsave post | - |
| `/interaction/:post_id/likes_count` | GET | 🔓 | Get likes count | - |
| `/interaction/:post_id/ratings_count` | GET | 🔓 | Get ratings count | - |
| `/interaction/saved_posts` | GET | 🔒 | Get saved posts | - |

## Database Models with Attributes

### category model
{
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}

### sub_category model
{
  name: { type: String, required: true, unique: true },
  category: { 
    type: Schema.Types.ObjectId, 
    ref: "category", 
    required: true 
  },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}

### post model
{
  title: { type: String, required: true },
  content: { type: String, required: true },
  files: {
    urls: [{
      secure_url: { type: String },
      public_id: { type: String }
    }],
    custom_id: { type: String }
  },
  author: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  interactions: [{ 
    type: Schema.Types.ObjectId, 
    ref: "interaction" 
  }],
  comments: [{ 
    type: Schema.Types.ObjectId, 
    ref: "comment" 
  }],
  sub_category: { 
    type: Schema.Types.ObjectId, 
    ref: "sub_category" 
  },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}

### comment model
{
  text: { type: String, required: true },
  author: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  post_id: { 
    type: Schema.Types.ObjectId, 
    ref: "post", 
    required: true 
  },
  parent_comment: { 
    type: Schema.Types.ObjectId, 
    ref: "comment" 
  },
  replies: [{ 
    type: Schema.Types.ObjectId, 
    ref: "comment" 
  }],
  createdAt: { type: Date },
  updatedAt: { type: Date }
}

### interaction model
{
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  post_id: { 
    type: Schema.Types.ObjectId, 
    ref: "post", 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["like", "rating", "save"], 
    required: true 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}



