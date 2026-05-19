const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testParentStudentRelationship() {
  console.log('='.repeat(60));
  console.log('TESTING PARENT ↔ STUDENT RELATIONSHIP');
  console.log('='.repeat(60));

  try {
    // Step 1: Register a new student with parent
    console.log('\n📝 Step 1: Registering new student with parent...');
    const registrationData = {
      student: {
        fullName: 'Test Student ' + Date.now(),
        gender: 'male',
        age: 12,
        residency: 'Test City',
        levelOfQuran: 'Beginner',
        email: `teststudent${Date.now()}@test.com`,
        password: 'Test123!',
        confirmPassword: 'Test123!',
      },
      parent: {
        fullName: 'Test Parent ' + Date.now(),
        email: `testparent${Date.now()}@test.com`,
        phoneNumber: '+1234567890',
        residency: 'Test City',
        relationshipWithStudent: 'Father',
      },
    };

    const registerResponse = await axios.post(`${API_URL}/auth/register`, registrationData);
    console.log('✅ Registration successful!');
    console.log('Student Token:', registerResponse.data.access_token.substring(0, 20) + '...');

    // Step 2: Login as super admin to access parent data
    console.log('\n🔐 Step 2: Logging in as super admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'nejahsuperadmin@gmail.com',
      password: 'SuperAdmin123',
    });
    const adminToken = loginResponse.data.access_token;
    console.log('✅ Admin login successful!');

    // Step 3: Fetch all parents
    console.log('\n👨‍👩‍👧 Step 3: Fetching all parents...');
    const parentsResponse = await axios.get(`${API_URL}/parents`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const parents = parentsResponse.data.data || parentsResponse.data;
    console.log(`✅ Found ${parents.length} parents`);

    // Step 4: Check if the newly created parent has the student linked
    console.log('\n🔍 Step 4: Checking parent-student relationships...');
    const parentWithEmail = registrationData.parent.email;
    const newParent = parents.find((p) => p.email === parentWithEmail);

    if (newParent) {
      console.log('\n✅ Found the newly created parent:');
      console.log('   Parent Name:', newParent.fullName);
      console.log('   Parent Email:', newParent.email);
      console.log('   Parent ID:', newParent.id);
      console.log('   Number of Students:', newParent.students ? newParent.students.length : 0);

      if (newParent.students && newParent.students.length > 0) {
        console.log('\n✅ STUDENTS LINKED SUCCESSFULLY:');
        newParent.students.forEach((student, index) => {
          console.log(`   ${index + 1}. ${student.fullName} (${student.email})`);
          console.log(`      Level: ${student.level}`);
          console.log(`      Status: ${student.status}`);
        });
      } else {
        console.log('\n❌ NO STUDENTS LINKED TO THIS PARENT!');
        console.log('   This is the issue that needs to be fixed.');
      }
    } else {
      console.log('\n❌ Could not find the newly created parent in the list!');
    }

    // Step 5: Display all parents with their students
    console.log('\n📊 Step 5: All Parents and Their Students:');
    console.log('='.repeat(60));
    parents.forEach((parent, index) => {
      console.log(`\n${index + 1}. ${parent.fullName} (${parent.email})`);
      if (parent.students && parent.students.length > 0) {
        parent.students.forEach((student) => {
          console.log(`   └─ ${student.fullName} - ${student.level}`);
        });
      } else {
        console.log('   └─ No students assigned');
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETED');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testParentStudentRelationship();
