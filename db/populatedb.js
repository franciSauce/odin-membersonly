require('dotenv').config();

const { Client } = require('pg');
const { argv, env } = require('node:process');
const { DB_CONNECTION_STRING } = require('./config');

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  password VARCHAR(255),
  is_member BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INTEGER NOT NULL,
  title VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_users
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_sessions (
  sid varchar PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON user_sessions (expire);
`;

const seedUsers = [
  {
    firstName: 'Greg',
    lastName: 'Diaz',
    username: 'admin',
    password: env.ADMIN_HASHED_PASSWORD,
    isMember: true,
    isAdmin: true,
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    username: 'janedoe',
    password: env.MEMBER_HASHED_PASSWORD,
    isMember: true,
    isAdmin: false,
  },
  {
    firstName: 'John',
    lastName: 'Smith',
    username: 'johnsmith',
    password: env.USER_HASHED_PASSWORD,
    isMember: false,
    isAdmin: false,
  },
];

const seedMessages = [
  {
    username: 'admin',
    title: 'Welcome to the Club',
    message: 'Hello everyone! I am excited to be part of this exclusive members-only club. Looking forward to connecting with all of you!',
  },
  {
    username: 'janedoe',
    title: 'First Post',
    message: 'Hi all, this is my first post here. Happy to join the community and share my thoughts!',
  },
  {
    username: 'admin',
    title: 'Event Announcement',
    message: 'We are thrilled to announce our upcoming members-only event! Stay tuned for more details.',
  },
  {
    username: 'johnsmith',
    title: 'Greetings',
    message: 'Hello! Just wanted to say hi to everyone here. Looking forward to engaging with you all.',
  },
];

const usage = () => {
  console.log('Usage: npm run db:seed [-- <connection-string>]');
  console.log('Without a connection string, DB_CONNECTION_STRING from .env is used.');
};

const main = async () => {
  const connectionString = argv[2] || DB_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Set DB_CONNECTION_STRING in .env or pass a connection string.');
  }

  const missingPasswords = seedUsers.filter(({ password }) => !password);
  if (missingPasswords.length) {
    throw new Error('Set ADMIN_HASHED_PASSWORD, MEMBER_HASHED_PASSWORD, and USER_HASHED_PASSWORD in .env.');
  }

  const invalidPasswordHashes = seedUsers.filter(({ password }) =>
    !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password));
  if (invalidPasswordHashes.length) {
    throw new Error('Seed passwords must be bcrypt hashes.');
  }

  const client = new Client({ connectionString });
  let connected = false;
  let transactionStarted = false;

  try {
    await client.connect();
    connected = true;
    await client.query('BEGIN');
    transactionStarted = true;
    await client.query(SQL);

    for (const user of seedUsers) {
      await client.query(
        `INSERT INTO users (first_name, last_name, username, password, is_member, is_admin)
         SELECT $1, $2, $3, $4, $5, $6
         WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = $3)`,
        [
          user.firstName,
          user.lastName,
          user.username,
          user.password,
          user.isMember,
          user.isAdmin,
        ],
      );
    }

    for (const message of seedMessages) {
      await client.query(
        `INSERT INTO messages (user_id, title, message)
         SELECT users.id, $1, $2
         FROM users
         WHERE users.username = $3
           AND NOT EXISTS (
             SELECT 1
             FROM messages
             WHERE messages.user_id = users.id
               AND messages.title = $1
               AND messages.message = $2
           )`,
        [message.title, message.message, message.username],
      );
    }

    await client.query('COMMIT');
    transactionStarted = false;
    console.log('Database schema is ready; missing demo data has been seeded.');
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Database rollback failed:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    if (connected) await client.end();
  }
};

if (argv.includes('--help') || argv.includes('-h')) {
  usage();
} else {
  main().catch((error) => {
    console.error('Error preparing database:', error.message);
    process.exitCode = 1;
  });
}
