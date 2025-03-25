'use client';
/* This file must be used only in client components */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  AuthType, 
  JenkinsConnection, 
  JenkinsJob, 
  JenkinsBuild,
  JenkinsNode,
  JenkinsQueue,
  JenkinsQueueItem,
  JenkinsPlugin,
  JenkinsFolder
} from './jenkins-types';

class JenkinsApiClient {
  private axios: AxiosInstance;
  private connection: JenkinsConnection;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second delay between retries
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private cacheExpiry: number = 30000; // 30 seconds cache expiry
  
  // Helper method to get data from cache or fetch it
  private async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    // Skip cache if caching is disabled
    if (!useCache) {
      return fetchFn();
    }
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    // Return cached data if it exists and hasn't expired
    if (cached && (now - cached.timestamp < this.cacheExpiry)) {
      return cached.data as T;
    }
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Update cache
    this.cache.set(cacheKey, { data, timestamp: now });
    
    return data;
  }

  // Helper method to perform requests with retry logic
  private async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    errorMessage: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        // Don't retry if we've reached max attempts or if it's a 4xx error (client error)
        const isClientError = error.response && error.response.status >= 400 && error.response.status < 500;
        if (attempt >= maxRetries || isClientError) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt))); // Exponential backoff
        console.log(`Retrying request (${attempt + 1}/${maxRetries})...`);
      }
    }
    
    const errorDetail = lastError.response?.data?.message || lastError.message || 'Unknown error';
    console.error(`${errorMessage}:`, errorDetail);
    throw new Error(`${errorMessage}: ${errorDetail}`);
  }

  constructor(connection: JenkinsConnection) {
    this.connection = connection;
    
    // Create axios config based on authentication type
    const config: AxiosRequestConfig = {
      baseURL: connection.url,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // Default 30 second timeout
      validateStatus: (status) => status >= 200 && status < 500 // Only reject on server errors
    };

    // Configure authentication based on the selected type
    switch (connection.authType) {
      case AuthType.BASIC:
        // Basic authentication with username and token
        if (connection.username && connection.token) {
          config.auth = {
            username: connection.username,
            password: connection.token
          };
        }
        break;
      
      case AuthType.TOKEN:
        // API token authentication
        if (connection.token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${connection.token}`
          };
        }
        break;
      
      case AuthType.SSO:
        // SSO token authentication
        if (connection.ssoToken) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${connection.ssoToken}`
          };
        }
        
        // Enable withCredentials for SSO cookie-based auth if needed
        if (connection.cookieAuth) {
          config.withCredentials = true;
        }
        break;
      
      case AuthType.BASIC_AUTH:
        // Basic authentication with username and password
        if (connection.username && connection.password) {
          config.auth = {
            username: connection.username,
            password: connection.password
          };
        }
        break;
    }
    
    // Create axios instance with the configured options
    this.axios = axios.create(config);
  }

  // Test connection to Jenkins
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.axios.get('/api/json');
      return response.status === 200;
    } catch (error) {
      console.error('Error testing Jenkins connection:', error);
      return false;
    }
  }

  // Get Jenkins server information
  async getServerInfo() {
    try {
      const response = await this.axios.get('/api/json');
      return response.data;
    } catch (error) {
      console.error('Error getting Jenkins server info:', error);
      throw error;
    }
  }

  // Get all jobs
  async getJobs(useCache: boolean = true): Promise<JenkinsJob[]> {
    const cacheKey = 'jobs';
    
    return this.getCachedOrFetch(
      cacheKey,
      () => this.requestWithRetry(
        async () => {
          const response = await this.axios.get('/api/json?tree=jobs[name,url,color]');
          return response.data.jobs || [];
        },
        'Error getting Jenkins jobs'
      ),
      useCache
    );
  }

  // Get job details
  async getJobDetails(jobName: string, useCache: boolean = true): Promise<JenkinsJob> {
    const cacheKey = `job_details_${jobName}`;
    const encodedJobName = encodeURIComponent(jobName);
    
    return this.getCachedOrFetch(
      cacheKey,
      () => this.requestWithRetry(
        async () => {
          const response = await this.axios.get(
            `/job/${encodedJobName}/api/json?tree=name,url,color,lastBuild[number,url,result,timestamp,duration,building]`
          );
          return response.data;
        },
        `Error getting Jenkins job details for ${jobName}`
      ),
      useCache
    );
  }

  // Get builds for a job
  async getBuilds(jobName: string, count: number = 10, useCache: boolean = true): Promise<JenkinsBuild[]> {
    const cacheKey = `builds_${jobName}_${count}`;
    const encodedJobName = encodeURIComponent(jobName);
    
    return this.getCachedOrFetch(
      cacheKey,
      () => this.requestWithRetry(
        async () => {
          const response = await this.axios.get(
            `/job/${encodedJobName}/api/json?tree=builds[number,url,result,timestamp,duration,building]{0,${count}}`
          );
          return response.data.builds || [];
        },
        `Error getting builds for job ${jobName}`
      ),
      useCache
    );
  }

  // Get build details
  async getBuildDetails(jobName: string, buildNumber: number): Promise<any> {
    try {
      const encodedJobName = encodeURIComponent(jobName);
      const response = await this.axios.get(
        `/job/${encodedJobName}/${buildNumber}/api/json`
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting build details for ${jobName} #${buildNumber}:`, error);
      throw error;
    }
  }

  // Get build console output
  async getBuildConsoleOutput(jobName: string, buildNumber: number): Promise<string> {
    try {
      const encodedJobName = encodeURIComponent(jobName);
      const response = await this.axios.get(
        `/job/${encodedJobName}/${buildNumber}/consoleText`
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting console output for ${jobName} #${buildNumber}:`, error);
      throw error;
    }
  }

  // Get nodes (agents)
  async getNodes(): Promise<JenkinsNode[]> {
    try {
      const response = await this.axios.get(
        '/computer/api/json?tree=computer[displayName,description,offline,temporarilyOffline,monitorData]'
      );
      return response.data.computer;
    } catch (error) {
      console.error('Error getting Jenkins nodes:', error);
      throw error;
    }
  }

  // Get queue information
  async getQueue(): Promise<JenkinsQueue> {
    try {
      const response = await this.axios.get(
        '/queue/api/json?tree=items[id,task[name,url],stuck,why,buildableStartMilliseconds]'
      );
      return response.data;
    } catch (error) {
      console.error('Error getting Jenkins queue:', error);
      throw error;
    }
  }

  // Get plugins
  async getPlugins(): Promise<JenkinsPlugin[]> {
    try {
      const response = await this.axios.get(
        '/pluginManager/api/json?tree=plugins[shortName,longName,version,active,enabled]'
      );
      return response.data.plugins;
    } catch (error) {
      console.error('Error getting Jenkins plugins:', error);
      throw error;
    }
  }

  // Trigger a build
  async triggerBuild(jobName: string, parameters: Record<string, string> = {}): Promise<void> {
    try {
      const encodedJobName = encodeURIComponent(jobName);
      
      // Check if job has parameters
      const jobInfo = await this.getJobDetails(jobName);
      const hasParameters = jobInfo.property ? 
        jobInfo.property.some((prop: any) => prop._class && prop._class.includes('ParametersDefinitionProperty')) : 
        false;
      
      if (hasParameters && Object.keys(parameters).length > 0) {
        // Build with parameters
        await this.axios.post(`/job/${encodedJobName}/buildWithParameters`, null, {
          params: parameters,
          timeout: 30000 // 30 second timeout
        });
      } else {
        // Build without parameters
        await this.axios.post(`/job/${encodedJobName}/build`, null, {
          timeout: 30000 // 30 second timeout
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error(`Error triggering build for job ${jobName}:`, errorMessage);
      throw new Error(`Failed to trigger build: ${errorMessage}`);
    }
  }

  // Get system statistics
  async getSystemStats(): Promise<any> {
    try {
      // Get overall load statistics
      const loadStats = await this.axios.get('/overallLoad/api/json');
      
      // Get executor information
      const executorInfo = await this.axios.get('/computer/api/json?tree=computer[displayName,executors[idle,likelyStuck,progress]]');
      
      return {
        loadStats: loadStats.data,
        executorInfo: executorInfo.data
      };
    } catch (error) {
      console.error('Error getting Jenkins system stats:', error);
      throw error;
    }
  }

  // Analyze common issues
  async analyzeIssues(useCache: boolean = false): Promise<any> {
    // We default to not using the cache for analysis as we want fresh data
    const cacheKey = 'issues_analysis';
    
    return this.getCachedOrFetch(
      cacheKey, 
      () => this.requestWithRetry(
        async () => {
          // Get recent builds to analyze for issues - don't use cache for this analysis
          const jobs = await this.getJobs(false);
          const issuesFound = [];
          
          // Analyze jobs in parallel (up to 10 jobs for performance)
          const jobsToAnalyze = jobs.slice(0, 10);
          const analysisPromises = jobsToAnalyze.map(async (job) => {
            try {
              const jobDetails = await this.getJobDetails(job.name, false);
              if (!jobDetails.lastBuild) return null;
              
              const builds = await this.getBuilds(job.name, 5, false);
              const jobIssues = [];
              
              // Check for failed builds
              const failedBuilds = builds.filter(build => build.result === 'FAILURE');
              if (failedBuilds.length > 0) {
                jobIssues.push({
                  type: 'Build Failure',
                  job: job.name,
                  build: `#${failedBuilds[0].number}`,
                  time: new Date(failedBuilds[0].timestamp).toLocaleString(),
                  severity: failedBuilds.length > 2 ? 'high' : 'medium',
                  url: failedBuilds[0].url
                });
              }
              
              // Check for long-running builds
              const longRunningBuilds = builds.filter(build => build.building && (Date.now() - build.timestamp > 3600000)); // Running for more than 1 hour
              if (longRunningBuilds.length > 0) {
                jobIssues.push({
                  type: 'Stuck Build',
                  job: job.name,
                  build: `#${longRunningBuilds[0].number}`,
                  time: new Date(longRunningBuilds[0].timestamp).toLocaleString(),
                  severity: 'high',
                  url: longRunningBuilds[0].url
                });
              }
              
              return jobIssues;
            } catch (error) {
              console.error(`Error analyzing job ${job.name}:`, error);
              return null;
            }
          });
          
          // Wait for all job analyses to complete
          const jobAnalysisResults = await Promise.all(analysisPromises);
          jobAnalysisResults.forEach(issues => {
            if (issues && issues.length > 0) {
              issuesFound.push(...issues);
            }
          });
          
          // Check queue for stuck items (in parallel with job analysis)
          try {
            const queue = await this.getQueue();
            const stuckItems = queue.items.filter(item => item.stuck);
            if (stuckItems.length > 0) {
              stuckItems.forEach(item => {
                issuesFound.push({
                  type: 'Stuck in Queue',
                  job: item.task.name,
                  build: 'N/A',
                  time: new Date(item.buildableStartMilliseconds).toLocaleString(),
                  severity: 'medium',
                  url: item.task.url
                });
              });
            }
          } catch (error) {
            console.error('Error analyzing queue:', error);
          }
          
          // Check for nodes with issues
          try {
            const nodes = await this.getNodes();
            const offlineNodes = nodes.filter(node => node.offline && !node.temporarilyOffline);
            if (offlineNodes.length > 0) {
              offlineNodes.forEach(node => {
                issuesFound.push({
                  type: 'Offline Node',
                  job: 'N/A',
                  build: 'N/A',
                  agent: node.displayName,
                  time: new Date().toLocaleString(),
                  severity: 'high'
                });
              });
            }
          } catch (error) {
            console.error('Error analyzing nodes:', error);
          }
          
          return {
            issues: issuesFound,
            summary: {
              buildFailures: issuesFound.filter(issue => issue.type === 'Build Failure').length,
              stuckBuilds: issuesFound.filter(issue => issue.type === 'Stuck Build').length,
              queueIssues: issuesFound.filter(issue => issue.type === 'Stuck in Queue').length,
              nodeIssues: issuesFound.filter(issue => issue.type === 'Offline Node').length
            },
            timestamp: Date.now()
          };
        },
        'Error analyzing Jenkins issues'
      ),
      useCache
    );
  }
}

export default JenkinsApiClient;
