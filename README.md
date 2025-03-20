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


