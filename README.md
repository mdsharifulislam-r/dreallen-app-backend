# Project Name

This is a template project for backend development using Typescript, Node.js, Express, Mongoose, Bcrypt, JWT, NodeMailer, Multer, ESLint, and Prettier. The aim is to reduce setup time for new backend projects.

## Features

- **Authentication API:** Complete authentication system using JWT for secure token-based authentication and bcrypt for password hashing.
- **File Upload:** Implemented using Multer with efficient file handling and short-term storage.
- **Data Validation:** Robust data validation using Zod and Mongoose schemas.
- **Code Quality:** Ensured code readability and quality with ESLint and Prettier.
- **Email Service:** Sending emails through NodeMailer.
- **File Handling:** Efficient file deletion using `fs.unlink`.
- **Environment Configuration:** Easy configuration using a `.env` file.
- **Logging:** Logging with Winston and file rotation using DailyRotateFile.
- **API Request Logging:** Logging API requests using Morgan.

## Tech Stack

- Typescript
- Node.js
- Express
- Mongoose
- Bcrypt
- JWT
- NodeMailer
- Multer
- ESLint
- Prettier
- Winston
- Daily-winston-rotate-file
- Morgen
- Socket

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

Ensure you have the following installed:

- Node.js
- npm or yarn

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/your-repository.git
   cd your-repository
   ```

2. **Install dependencies:**

   Using npm:

   ```bash
   npm install
   ```

   Using yarn:

   ```bash
   yarn install
   ```

3. **Create a `.env` file:**

   In the root directory of the project, create a `.env` file and add the following variables. Adjust the values according to your setup.

   ```env
   # Basic
   NODE_ENV=development
   DATABASE_URL=mongodb://127.0.0.1:27017/project_name
   IP_ADDRESS=192.0.0.0
   PORT=5000

   # Bcrypt
   BCRYPT_SALT_ROUNDS=12

   # JWT
   JWT_SECRET=jwt_secret
   JWT_EXPIRE_IN=1d

   # Email
   EMAIL_FROM=email@gmail.com
   EMAIL_USER=email@gmail.com
   EMAIL_PASS=mkqcfjeqloothyax
   EMAIL_PORT=587
   EMAIL_HOST=smtp.gmail.com

   # DigitalOcean Spaces
   SPACES_ACCESS_KEY_ID=your_spaces_access_key_id
   SPACES_SECRET_ACCESS_KEY=your_spaces_secret_access_key
   SPACES_BUCKET=urban-music-flow-media
   # Spaces datacenter (used to build the endpoint)
   SPACES_REGION=nyc3
   SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   ```

   Create a Spaces access key with the required bucket permissions and keep the
   key and secret only in `.env` or your deployment secret manager. Uploaded
   objects are written with public-read access and API responses store their
   public Spaces object URLs. Set `SPACES_REGION` and `SPACES_ENDPOINT` to the
   bucket's actual Spaces datacenter. Multipart and chunked uploads use the
   same uploader. If a key has been exposed, revoke it in DigitalOcean and
   create a new bucket-scoped key before updating the environment and restarting
   the application. Startup validates required settings and checks that the API
   endpoint matches the configured region; it cannot verify that a key is valid.

   After setting newly generated credentials, verify access with:

   ```bash
   npm run spaces:check
   ```

   This creates and deletes a temporary text object under `healthcheck/` and
   prints only the result, never the access key, secret, or object URL.

4. **Run the project:**

   Using npm:

   ```bash
   npm run dev
   ```

   Using yarn:

   ```bash
   yarn run dev
   ```

### Running the Tests

Explain how to run the automated tests for this system.

```bash
npm test
```
# dreallen-app-backend
