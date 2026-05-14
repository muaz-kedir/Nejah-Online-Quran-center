// Simple database connection test
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Basic .env parser to load credentials without needing dotenv package
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env...');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  } else {
    console.warn('.env file not found. Using existing process.env variables.');
  }
}

loadEnv();

// Support both DB_NAME and DB_DATABASE
const dbName = process.env.DB_NAME || process.env.DB_DATABASE || 'postgres';

// Construct connection string
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}`;

const client = new Client({
  connectionString: connectionString,
  ssl: process.env.DB_HOST === 'localhost' ? false : {
    rejectUnauthorized: false
  }
});

console.log('Attempting to connect to PostgreSQL database...');
console.log('Host:', process.env.DB_HOST || 'via DATABASE_URL');
console.log('Port:', process.env.DB_PORT || '5432');
console.log('Database:', dbName);
console.log('');

client.connect()
  .then(() => {
    console.log('✅ Successfully connected to the database!');
    return client.query('SELECT NOW()');
  })
  .then((result) => {
    console.log('✅ Database time:', result.rows[0].now);
    return client.query('SELECT version()');
  })
  .then((result) => {
    console.log('✅ PostgreSQL version:', result.rows[0].version);
    return client.end();
  })
  .then(() => {
    console.log('✅ Connection closed successfully');
    console.log('');
    console.log('🎉 Database connection is working! You can now start the NestJS backend.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    console.error('');
    
    console.error('Please check:');
    console.error('1. Is PostgreSQL service running?');
    console.error('2. Are the credentials in .env correct?');
    console.error(`3. Does the database "${dbName}" exist?`);
    console.error('');
    process.exit(1);
  });
