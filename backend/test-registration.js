const fetch = require('node-fetch');

async function testRegistration() {
  const testData = {
    student: {
      fullName: "Test Student New",
      gender: "male",
      age: 20,
      residency: "United States of America",
      levelOfQuran: "beginner",
      email: "teststudent" + Date.now() + "@example.com",
      password: "password123",
      confirmPassword: "password123"
    },
    parent: {
      fullName: "Test Parent New",
      email: "testparent" + Date.now() + "@example.com",
      phoneNumber: "+1234567890",
      residency: "United States of America",
      relationshipWithStudent: "father"
    }
  };

  console.log('Testing registration with data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const data = await response.json();

    console.log('Response status')