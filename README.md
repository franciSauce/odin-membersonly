# Odin Members Only

A members-only message board built with Node.js, Express, EJS, and PostgreSQL. Guests can browse messages anonymously; signed-in members can see authors' names, and signed-in users can post messages.

## Screenshots

### Message board

![Members Only guest message board](docs/images/message-board.png)

### Login

![Members Only login form](docs/images/login.png)

## Features

- Browse messages as a guest.
- Sign up, log in, and persist sessions in PostgreSQL.
- Post messages when signed in.
- Join as a member with the configured member passcode to see message authors.
- Use the configured admin passcode to become an admin and delete messages.

## Getting started

### Prerequisites

- Node.js and npm
- A PostgreSQL database

### Install and configure

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the project root:

   ```dotenv
   DB_CONNECTION_STRING=postgresql://USER:PASSWORD@HOST:5432/DATABASE
   SESSION_SECRET=<long-random-secret>
   PORT=3000
   ADMIN_HASHED_PASSWORD=<bcrypt-hash>
   MEMBER_HASHED_PASSWORD=<bcrypt-hash>
   USER_HASHED_PASSWORD=<bcrypt-hash>
   MEMBER_PASSCODE=<your-member-passcode>
   ADMIN_PASSCODE=<your-admin-passcode>
   ```

   `PORT` is optional and defaults to `3000`. `SESSION_SECRET` should be long
   and random. The three seed password variables must be bcrypt hashes, not
   plaintext passwords. Keep `.env` private and never commit it.

3. Create the database tables and add any missing demo users and messages:

   ```sh
   npm run db:seed
   ```

   The command uses `DB_CONNECTION_STRING` from `.env` and is safe to rerun.
   Run it only against the intended development database; it inserts demo
   data.

4. Start the development server:

   ```sh
   npm run dev
   ```

   Visit `http://localhost:3000` (or the port configured in `.env`). To start
   without nodemon, run `npm start`.

## Tech stack

- Node.js and Express
- EJS templates
- PostgreSQL with `pg` and `connect-pg-simple`
- Passport local authentication and `bcryptjs`