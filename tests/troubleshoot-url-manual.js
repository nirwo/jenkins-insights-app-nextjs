// Manual test script for troubleshoot-url functionality
// Run with: node tests/troubleshoot-url-manual.js

// Mock console parsing function
function parseConsoleForErrors(consoleOutput) {
  if (!consoleOutput) return [];
  
  const errors = [];
  const lines = consoleOutput.split('\n');
  
  // Common error patterns
  const errorPatterns = [
    { regex: /exception in thread|java\.lang\.[a-z]+exception/i, type: 'java', severity: 'high' },
    { regex: /error:|exception:|failure:|failed:/i, type: 'general', severity: 'medium' },
    { regex: /warning:/i, type: 'warning', severity: 'low' }
  ];
  
  // Scan for errors
  lines.forEach((line, index) => {
    for (const pattern of errorPatterns) {
      if (pattern.regex.test(line)) {
        errors.push({
          line: index + 1,
          text: line.trim(),
          type: pattern.type,
          severity: pattern.severity
        });
        break;
      }
    }
  });
  
  return errors;
}

// Example job URL extraction
function extractJobInfo(url) {
  try {
    // Simple extraction logic
    if (url.includes('/job/')) {
      const match = url.match(/\/job\/([^\/]+)/);
      if (match && match[1]) {
        const jobName = match[1];
        console.log(`Successfully extracted job name: ${jobName}`);
        return { jobName };
      }
    }
    
    throw new Error('Could not determine job name from URL');
  } catch (error) {
    console.error(`Error extracting job info: ${error.message}`);
    return null;
  }
}

// Test sample console outputs
const testConsoleOutputs = [
  {
    name: 'Build with Java exception',
    content: `
Starting build #123
Cloning repository
Checkout branch 'main'
java.lang.NullPointerException at line 50
Caused by: org.apache.maven.plugin.MojoExecutionException
Process exited with code 1
    `
  },
  {
    name: 'Build with general errors',
    content: `
Starting build #456
Running tests
Error: Could not connect to database
Failure: 3 of 10 tests failed
Process exited with code 1
    `
  },
  {
    name: 'Successful build with warnings',
    content: `
Starting build #789
Compiling source code
Warning: deprecated API usage on line 205
Warning: unused import on line 32
Build completed successfully
    `
  },
  {
    name: 'Clean build',
    content: `
Starting build #999
All steps completed successfully
Build completed in 45 seconds
    `
  }
];

// Test URLs
const testUrls = [
  'https://jenkins.example.com/job/backend-service',
  'https://jenkins.example.com/job/frontend-app/123',
  'https://jenkins.internal/view/All/job/deployment',
  'https://jenkins.example.com/invalid-path',
];

// Run tests
function runTests() {
  console.log('=== Testing URL parsing ===');
  testUrls.forEach(url => {
    console.log(`\nTesting URL: ${url}`);
    const jobInfo = extractJobInfo(url);
    if (jobInfo) {
      console.log(`Extracted info: ${JSON.stringify(jobInfo)}`);
    } else {
      console.log('Failed to extract job info');
    }
  });
  
  console.log('\n=== Testing console error detection ===');
  testConsoleOutputs.forEach(test => {
    console.log(`\nTesting "${test.name}":`);
    console.log('-'.repeat(40));
    
    const errors = parseConsoleForErrors(test.content);
    
    if (errors.length > 0) {
      console.log(`Found ${errors.length} issues:`);
      errors.forEach(error => {
        console.log(`- Line ${error.line}: ${error.text} (${error.type}, ${error.severity})`);
      });
    } else {
      console.log('No issues found');
    }
  });
}

// Run all tests
runTests();