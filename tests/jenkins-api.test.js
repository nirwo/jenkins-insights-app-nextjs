// Tests for JenkinsApiClient
import JenkinsApiClient, { AuthType } from '../src/lib/jenkins-api';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('JenkinsApiClient', () => {
  let client;
  let mockConnection;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock connection
    mockConnection = {
      id: 'test-id',
      name: 'Test Jenkins',
      url: 'https://jenkins.example.com',
      authType: AuthType.BASIC,
      username: 'testuser',
      token: 'testtoken'
    };
    
    // Mock axios create to return a mock instance
    axios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn()
    });
    
    // Create client instance
    client = new JenkinsApiClient(mockConnection);
  });
  
  test('should configure axios with correct auth', () => {
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: mockConnection.url,
      timeout: 30000,
      auth: {
        username: mockConnection.username,
        password: mockConnection.token
      }
    }));
  });
  
  test('getJobs should call the correct endpoint', async () => {
    // Mock the response
    const mockResponse = {
      data: {
        jobs: [{ name: 'job1' }, { name: 'job2' }]
      }
    };
    
    client.axios.get.mockResolvedValueOnce(mockResponse);
    
    // Call the method
    const jobs = await client.getJobs();
    
    // Verify it made the right call
    expect(client.axios.get).toHaveBeenCalledWith('/api/json?tree=jobs[name,url,color]');
    expect(jobs).toEqual(mockResponse.data.jobs);
  });
  
  test('getJobs should use cache on second call', async () => {
    // Mock the response
    const mockResponse = {
      data: {
        jobs: [{ name: 'job1' }, { name: 'job2' }]
      }
    };
    
    client.axios.get.mockResolvedValueOnce(mockResponse);
    
    // Call the method twice
    const jobs1 = await client.getJobs();
    const jobs2 = await client.getJobs();
    
    // Verify axios was only called once
    expect(client.axios.get).toHaveBeenCalledTimes(1);
    expect(jobs1).toEqual(jobs2);
  });
  
  test('getJobs should bypass cache when requested', async () => {
    // Mock the responses
    const mockResponse1 = {
      data: {
        jobs: [{ name: 'job1' }, { name: 'job2' }]
      }
    };
    
    const mockResponse2 = {
      data: {
        jobs: [{ name: 'job1' }, { name: 'job3' }]
      }
    };
    
    client.axios.get
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);
    
    // Call the method twice, but bypass cache on second call
    const jobs1 = await client.getJobs();
    const jobs2 = await client.getJobs(false);
    
    // Verify axios was called twice
    expect(client.axios.get).toHaveBeenCalledTimes(2);
    expect(jobs1).not.toEqual(jobs2);
  });
  
  test('should retry failed requests', async () => {
    // Mock a failed response followed by a successful one
    client.axios.get
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: { jobs: [{ name: 'job1' }] } });
    
    // Call the method
    const jobs = await client.getJobs();
    
    // Verify it retried and returned the successful response
    expect(client.axios.get).toHaveBeenCalledTimes(2);
    expect(jobs).toEqual([{ name: 'job1' }]);
  });
  
  test('triggerBuild should handle parameters correctly', async () => {
    // Mock the response for getting job details
    client.axios.get.mockResolvedValueOnce({
      data: {
        property: [
          { _class: 'hudson.model.ParametersDefinitionProperty' }
        ]
      }
    });
    
    // Mock the post response
    client.axios.post.mockResolvedValueOnce({ status: 201 });
    
    // Call the method with parameters
    await client.triggerBuild('test-job', { param1: 'value1' });
    
    // Verify it used the buildWithParameters endpoint
    expect(client.axios.post).toHaveBeenCalledWith(
      '/job/test-job/buildWithParameters',
      null,
      expect.objectContaining({
        params: { param1: 'value1' },
        timeout: 30000
      })
    );
  });
});