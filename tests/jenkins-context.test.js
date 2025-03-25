// Tests for Jenkins context
import React from 'react';
import { render, act } from '@testing-library/react';
import { JenkinsProvider, useJenkins, AuthType } from '../src/lib/jenkins-context';
import { encryptData, decryptData } from '../src/lib/utils';

// Mock dependencies
jest.mock('../src/lib/jenkins-api', () => {
  return {
    __esModule: true,
    AuthType: {
      BASIC: 'basic',
      TOKEN: 'token',
      SSO: 'sso',
      BASIC_AUTH: 'basic_auth'
    },
    default: jest.fn().mockImplementation(() => ({
      testConnection: jest.fn().mockResolvedValue(true),
    }))
  };
});

jest.mock('../src/lib/utils', () => ({
  encryptData: jest.fn(data => `ENCRYPTED:${data}`),
  decryptData: jest.fn(data => {
    if (data.startsWith('ENCRYPTED:')) {
      return data.substring(10);
    }
    return data;
  })
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component to expose context
const TestComponent = () => {
  const context = useJenkins();
  return (
    <div>
      <span data-testid="connection-count">{context.connections.length}</span>
      <button
        data-testid="add-connection"
        onClick={() => {
          context.addConnection({
            name: 'Test Connection',
            url: 'https://jenkins.example.com',
            username: 'testuser',
            token: 'testsecret'
          });
        }}
      >
        Add Connection
      </button>
    </div>
  );
};

describe('JenkinsProvider', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  test('should encrypt sensitive data when storing connections', async () => {
    // Render the provider with test component
    const { getByTestId } = render(
      <JenkinsProvider>
        <TestComponent />
      </JenkinsProvider>
    );
    
    // Add a connection
    await act(async () => {
      getByTestId('add-connection').click();
    });
    
    // Check localStorage was called with encrypted data
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    const saveCall = mockLocalStorage.setItem.mock.calls.find(
      call => call[0] === 'jenkins-connections'
    );
    
    expect(saveCall).toBeTruthy();
    
    // Parse the saved JSON to check encryption
    const savedData = JSON.parse(saveCall[1]);
    
    // Verify token was encrypted
    expect(encryptData).toHaveBeenCalledWith('testsecret');
    expect(savedData[0].token).toContain('ENCRYPTED:');
  });
  
  test('should decrypt sensitive data when loading connections', async () => {
    // Setup mock data in localStorage
    const mockEncryptedConnection = {
      id: 'test-id',
      name: 'Test Connection',
      url: 'https://jenkins.example.com',
      authType: 'basic',
      username: 'testuser',
      token: 'ENCRYPTED:testsecret'
    };
    
    mockLocalStorage.setItem('jenkins-connections', JSON.stringify([mockEncryptedConnection]));
    
    // Render the provider with test component
    const { getByTestId } = render(
      <JenkinsProvider>
        <TestComponent />
      </JenkinsProvider>
    );
    
    // Verify connections were loaded and decrypted
    expect(decryptData).toHaveBeenCalledWith('ENCRYPTED:testsecret');
    expect(getByTestId('connection-count').textContent).toBe('1');
  });
});