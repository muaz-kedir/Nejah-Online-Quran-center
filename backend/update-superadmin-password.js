const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function updatePassword() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'nejah_db',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Hash the new password
    const hashedPassword = await bcrypt.hash('SuperAdmin123', 10);
    console.log('Password hashed');

    // Update the super admin password
    const result = await client.query(
      "UPDATE users SET password = $1 WHERE email = 'nejahsuperadmin@gmail.com'",
      [hashedPassword]
    );

    console.log('✅ Super Admin password updated successfully!');
    console.log('Email: nejahsuperadmin@gmail.com');
    console.log('Password: SuperAdmin123');

    await client.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePassword();
