// Simple test file to verify utils functions
const { 
  encryptData, 
  decryptData, 
  maskSensitiveData, 
  formatDuration,
  formatDate,
  safeJsonParse
} = require('../src/lib/utils');

// Test encryption and decryption
describe('Encryption Functions', () => {
  test('encryptData should encrypt data', () => {
    const testData = 'sensitive-token-12345';
    const encrypted = encryptData(testData);
    
    // Should be prefixed and not equal to original
    expect(encrypted).toContain('JENKINS_INSIGHTS_ENC:');
    expect(encrypted).not.toEqual(testData);
  });
  
  test('decryptData should decrypt encrypted data', () => {
    const testData = 'sensitive-token-12345';
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);
    
    // Should restore the original data
    expect(decrypted).toEqual(testData);
  });
  
  test('decryptData should return original data if not encrypted', () => {
    const testData = 'not-encrypted-data';
    const result = decryptData(testData);
    
    expect(result).toEqual(testData);
  });
});

// Test sensitive data masking
describe('Data Masking', () => {
  test('maskSensitiveData should mask sensitive information', () => {
    const testData = 'password="secretValue123" token="tokenValue456" apikey="keyValue789"';
    const masked = maskSensitiveData(testData);
    
    expect(masked).toContain('password="****"');
    expect(masked).toContain('token="****"');
    expect(masked).not.toContain('secretValue123');
    expect(masked).not.toContain('tokenValue456');
  });
  
  test('maskSensitiveData should handle empty or null input', () => {
    expect(maskSensitiveData('')).toEqual('');
    expect(maskSensitiveData(null)).toEqual('');
    expect(maskSensitiveData(undefined)).toEqual('');
  });
});

// Test formatting functions
describe('Formatting Functions', () => {
  test('formatDuration should format milliseconds correctly', () => {
    expect(formatDuration(1000)).toEqual('1s');
    expect(formatDuration(60000)).toEqual('1m 0s');
    expect(formatDuration(3661000)).toEqual('1h 1m 1s');
    expect(formatDuration(0)).toEqual('0s');
  });
  
  test('formatDate should format timestamps', () => {
    const timestamp = 1598918400000; // 2020-09-01T00:00:00.000Z
    const formatted = formatDate(timestamp);
    expect(formatted).not.toEqual('N/A');
    
    expect(formatDate(0)).toEqual('N/A');
    expect(formatDate(null)).toEqual('N/A');
  });
});

// Test safe JSON parsing
describe('Safe JSON Parsing', () => {
  test('safeJsonParse should parse valid JSON', () => {
    const validJson = '{"key": "value", "number": 123}';
    const fallback = { default: true };
    
    const result = safeJsonParse(validJson, fallback);
    expect(result).toEqual({ key: 'value', number: 123 });
  });
  
  test('safeJsonParse should return fallback for invalid JSON', () => {
    const invalidJson = '{not valid json}';
    const fallback = { default: true };
    
    const result = safeJsonParse(invalidJson, fallback);
    expect(result).toEqual(fallback);
  });
});