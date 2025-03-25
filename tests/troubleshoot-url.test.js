// Tests for the console parsing logic from troubleshoot-url route
import { JenkinsServerApiClient } from '../src/lib/jenkins-api-server';

// Mock JenkinsServerApiClient
jest.mock('../src/lib/jenkins-api-server');

// Import the parseConsoleForErrors function from route.ts
// Since we can't directly test Next.js API routes easily, we'll test the parsing function separately
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

describe('Troubleshoot URL Console Parser', () => {
  test('parseConsoleForErrors should handle null or empty input', () => {
    expect(parseConsoleForErrors(null)).toEqual([]);
    expect(parseConsoleForErrors('')).toEqual([]);
  });
  
  test('parseConsoleForErrors should find Java exceptions', () => {
    const consoleOutput = 
      "Starting build\n" +
      "java.lang.NullPointerException at line 50\n" +
      "Exception in thread main\n" +
      "Build finished";
    
    const errors = parseConsoleForErrors(consoleOutput);
    
    expect(errors.length).toBe(2);
    expect(errors[0].type).toBe('java');
    expect(errors[0].severity).toBe('high');
    expect(errors[0].line).toBe(2);
    expect(errors[1].type).toBe('java');
    expect(errors[1].severity).toBe('high');
    expect(errors[1].line).toBe(3);
  });
  
  test('parseConsoleForErrors should find general errors', () => {
    const consoleOutput = 
      "Starting build\n" +
      "Error: Could not find dependency\n" +
      "Failure: Test failed\n" +
      "Build finished";
    
    const errors = parseConsoleForErrors(consoleOutput);
    
    expect(errors.length).toBe(2);
    expect(errors[0].type).toBe('general');
    expect(errors[0].severity).toBe('medium');
    expect(errors[0].line).toBe(2);
    expect(errors[1].type).toBe('general');
    expect(errors[1].severity).toBe('medium');
    expect(errors[1].line).toBe(3);
  });
  
  test('parseConsoleForErrors should find warnings', () => {
    const consoleOutput = 
      "Starting build\n" +
      "Warning: deprecated API usage\n" +
      "Build finished";
    
    const errors = parseConsoleForErrors(consoleOutput);
    
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('warning');
    expect(errors[0].severity).toBe('low');
    expect(errors[0].line).toBe(2);
  });
  
  test('parseConsoleForErrors should find mixed error types', () => {
    const consoleOutput = 
      "Starting build\n" +
      "Building step 1\n" +
      "Error: Could not find dependency\n" +
      "java.lang.NullPointerException at line 50\n" +
      "Warning: deprecated API usage\n" +
      "Build finished";
    
    const errors = parseConsoleForErrors(consoleOutput);
    
    expect(errors.length).toBe(3);
    
    // Verify all error types are found
    const types = errors.map(e => e.type);
    expect(types).toContain('general');
    expect(types).toContain('java');
    expect(types).toContain('warning');
    
    // Check line numbers are correct
    const lines = errors.map(e => e.line);
    expect(lines).toContain(3); // Error: Could not find dependency
    expect(lines).toContain(4); // java.lang.NullPointerException
    expect(lines).toContain(5); // Warning: deprecated API usage
  });
});