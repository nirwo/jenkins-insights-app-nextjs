// This is a simple script to manually test our API client
// Run this with: node tests/manual-test.js

const JenkinsApiClient = require('../src/lib/jenkins-api').default;
const { encryptData, decryptData, maskSensitiveData } = require('../src/lib/utils');

// ----------------------
// Mock Jenkins API server
// ----------------------
const mockServer = {
  handleRequest(url, config) {
    console.log(`Mock server received request for: ${url}`);
    
    // Simulate API endpoints
    if (url.includes('/api/json?tree=jobs')) {
      return {
        data: {
          jobs: [
            { name: 'job1', url: 'https://jenkins.example.com/job/job1', color: 'blue' },
            { name: 'job2', url: 'https://jenkins.example.com/job/job2', color: 'red' }
          ]
        }
      };
    }
    
    if (url.includes('/job/') && url.includes('/api/json')) {
      return {
        data: {
          name: 'job1',
          url: 'https://jenkins.example.com/job/job1',
          color: 'blue',
          lastBuild: {
            number: 123,
            url: 'https://jenkins.example.com/job/job1/123/',
            result: 'SUCCESS',
            timestamp: Date.now() - 3600000,
            duration: 120000,
            building: false
          }
        }
      };
    }
    
    // Default response
    return { data: { status: 'ok' } };
  }
};

// Mock axios
const axios = {
  create() {
    return {
      get: (url, config) => Promise.resolve(mockServer.handleRequest(url, config)),
      post: (url, data, config) => Promise.resolve({ status: 201 })
    };
  }
};

// Global axios (for testing)
global.axios = axios;

// ----------------------
// Run manual tests
// ----------------------

async function runTests() {
  console.log('Starting manual tests...');
  
  // Test encryption/decryption
  console.log('\n=== Testing encryption/decryption ===');
  const sensitiveData = 'my-secret-token-123';
  const encrypted = encryptData(sensitiveData);
  const decrypted = decryptData(encrypted);
  
  console.log(`Original: ${sensitiveData}`);
  console.log(`Encrypted: ${encrypted}`);
  console.log(`Decrypted: ${decrypted}`);
  console.log(`Encryption working: ${decrypted === sensitiveData ? 'YES' : 'NO'}`);
  
  // Test data masking
  console.log('\n=== Testing data masking ===');
  const consoleOutput = 'Setting password="supersecret123" and token="123456"\n' +
                       'Using credentials from environment\n' +
                       'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  
  const masked = maskSensitiveData(consoleOutput);
  console.log('Original output:');
  console.log(consoleOutput);
  console.log('\nMasked output:');
  console.log(masked);
  
  // Test API client
  console.log('\n=== Testing API client ===');
  const client = new JenkinsApiClient({
    id: 'test',
    name: 'Test Jenkins',
    url: 'https://jenkins.example.com',
    authType: 'basic',
    username: 'testuser',
    token: 'testtoken'
  });
  
  // Test caching
  console.log('\nTesting caching...');
  console.log('First call to getJobs:');
  const jobs1 = await client.getJobs();
  console.log(`Got ${jobs1.length} jobs`);
  
  console.log('Second call to getJobs (should use cache):');
  const jobs2 = await client.getJobs();
  console.log(`Got ${jobs2.length} jobs`);
  
  console.log('Call with useCache=false (should bypass cache):');
  const jobs3 = await client.getJobs(false);
  console.log(`Got ${jobs3.length} jobs`);
  
  console.log('\nTests completed!');
}

// Run the tests
runTests().catch(console.error);