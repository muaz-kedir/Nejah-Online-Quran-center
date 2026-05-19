const { Client } = require('pg');
require('dotenv').config();

async function deleteUserByEmail(email) {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nejah_db',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, find the user
    const userResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log(`No user found with email: ${email}`);
      return;
    }

    const user = userResult.rows[0];
    console.log('Found user:', user);

    // Delete related records first (students, parents)
    await client.query('DELETE FROM students WHERE "userId" = $1', [user.id]);
    console.log('Deleted related student records');

    // Delete the user
    await client.query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log(`Successfully deleted user: ${user.email}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node delete-user-by-email.js <email>');
  console.log('Example: node delete-user-by-email.js student@example.com');
  process.exit(1);
}

deleteUserByEmail(email);
