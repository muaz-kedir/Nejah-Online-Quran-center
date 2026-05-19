const https = require('http');

// First, login to get token
const loginData = JSON.stringify({
  email: 'nejahsuperadmin@gmail.com',
  password: 'SuperAdmin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('='.repeat(60));
console.log('TESTING PARENTS API RESPONSE');
console.log('='.repeat(60));

const loginReq = https.request(loginOptions, (loginRes) => {
  let loginBody = '';
  
  loginRes.on('data', (chunk) => {
    loginBody += chunk;
  });
  
  loginRes.on('end', () => {
    try {
      const loginResponse = JSON.parse(loginBody);
      const token = loginResponse.access_token;
      
      console.log('\n✅ Login successful!');
      console.log('Token:', token.substring(0, 20) + '...\n');
      
      // Now fetch parents
      const parentsOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/parents?page=1&limit=5',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const parentsReq = https.request(parentsOptions, (parentsRes) => {
        let parentsBody = '';
        
        parentsRes.on('data', (chunk) => {
          parentsBody += chunk;
        });
        
        parentsRes.on('end', () => {
          try {
            const parentsResponse = JSON.parse(parentsBody);
            
            console.log('📊 PARENTS API RESPONSE:\n');
            console.log('Response Structure:', Object.keys(parentsResponse));
            console.log('\nFull Response:');
            console.log(JSON.stringify(parentsResponse, null, 2));
            
            // Check if students are included
            const parents = parentsResponse.data || parentsResponse;
            if (Array.isArray(parents) && parents.length > 0) {
              console.log('\n' + '='.repeat(60));
              console.log('CHECKING STUDENTS IN RESPONSE:');
              console.log('='.repeat(60));
              
              parents.forEach((parent, index) => {
                console.log(`\n${index + 1}. ${parent.fullName} (${parent.email})`);
                console.log(`   Has 'students' property: ${parent.hasOwnProperty('students')}`);
                console.log(`   Students value:`, parent.students);
                
                if (parent.students) {
                  console.log(`   Students type: ${typeof parent.students}`);
                  console.log(`   Is Array: ${Array.isArray(parent.students)}`);
                  console.log(`   Length: ${parent.students.length}`);
                  
                  if (parent.students.length > 0) {
                    console.log(`   ✅ STUDENTS FOUND:`);
                    parent.students.forEach((student, idx) => {
                      console.log(`      ${idx + 1}. ${student.fullName} - ${student.level}`);
                    });
                  } else {
                    console.log(`   ❌ Students array is EMPTY`);
                  }
                } else {
                  console.log(`   ❌ NO students property in response`);
                }
              });
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('TEST COMPLETED');
            console.log('='.repeat(60));
            
          } catch (error) {
            console.error('❌ Error parsing parents response:', error.message);
            console.error('Raw response:', parentsBody);
          }
        });
      });
      
      parentsReq.on('error', (error) => {
        console.error('❌ Error fetching parents:', error.message);
      });
      
      parentsReq.end();
      
    } catch (error) {
      console.error('❌ Error parsing login response:', error.message);
      console.error('Raw response:', loginBody);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Error during login:', error.message);
});

loginReq.write(loginData);
loginReq.end();
