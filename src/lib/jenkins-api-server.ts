/**
 * Server-side implementation of Jenkins API client
 * This file is meant to be used in API routes only
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { JenkinsConnection, JenkinsJob, JenkinsBuild, JenkinsNode, JenkinsQueue, JenkinsPlugin, AuthType } from './jenkins-types';

class JenkinsServerApiClient {
  private axios: AxiosInstance;
  private connection: JenkinsConnection;
  
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
    } catch (error: any) {
      console.error('Error getting Jenkins server info:', error);
      throw new Error(`Failed to get server info: ${error.message || 'Unknown error'}`);
    }
  }

  // Get all jobs
  async getJobs(): Promise<JenkinsJob[]> {
    try {
      const response = await this.axios.get('/api/json?tree=jobs[name,url,color]');
      return response.data.jobs || [];
    } catch (error: any) {
      console.error('Error getting Jenkins jobs:', error);
      throw new Error(`Failed to get jobs: ${error.message || 'Unknown error'}`);
    }
  }

  // Get job details
  async getJobDetails(jobName: string): Promise<JenkinsJob> {
    try {
      const encodedJobName = encodeURIComponent(jobName);
      const response = await this.axios.get(
        `/job/${encodedJobName}/api/json?tree=name,url,color,lastBuild[number,url,result,timestamp,duration,building]`
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error getting Jenkins job details for ${jobName}:`, error);
      throw new Error(`Failed to get job details: ${error.message || 'Unknown error'}`);
    }
  }

  // Get builds for a job
  async getBuilds(jobName: string, count: number = 10): Promise<JenkinsBuild[]> {
    try {
      const encodedJobName = encodeURIComponent(jobName);
      const response = await this.axios.get(
        `/job/${encodedJobName}/api/json?tree=builds[number,url,result,timestamp,duration,building]{0,${count}}`
      );
      return response.data.builds || [];
    } catch (error: any) {
      console.error(`Error getting builds for job ${jobName}:`, error);
      throw new Error(`Failed to get builds: ${error.message || 'Unknown error'}`);
    }
  }

  // Get build details
  async getBuildDetails(jobName: string, buildNumber: number): Promise<any> {
    try {
      const encodedJobName = encodeURIComponent(jobName);
      const response = await this.axios.get(
        `/job/${encodedJobName}/${buildNumber}/api/json`
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error getting build details for ${jobName} #${buildNumber}:`, error);
      throw new Error(`Failed to get build details: ${error.message || 'Unknown error'}`);
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
    } catch (error: any) {
      console.error(`Error getting console output for ${jobName} #${buildNumber}:`, error);
      throw new Error(`Failed to get console output: ${error.message || 'Unknown error'}`);
    }
  }

  // Get job info from URL
  async getJobInfoFromUrl(url: string): Promise<any> {
    try {
      // Extract job name from URL
      const urlObj = new URL(url);
      let jobPath = '';
      
      // Determine if it's a job URL or a build URL
      if (url.includes('/job/')) {
        // Extract everything after /job/ until the next / or end
        const match = url.match(/\/job\/([^\/]+)/);
        if (match && match[1]) {
          jobPath = match[1];
        }
      }
      
      if (!jobPath) {
        throw new Error('Could not determine job name from URL');
      }
      
      // Get job details
      const jobDetails = await this.getJobDetails(jobPath);
      return {
        jobName: jobPath,
        jobDetails
      };
    } catch (error: any) {
      console.error(`Error getting job info from URL ${url}:`, error);
      throw new Error(`Failed to get job info from URL: ${error.message || 'Unknown error'}`);
    }
  }

  // Get nodes (agents)
  async getNodes(): Promise<JenkinsNode[]> {
    try {
      const response = await this.axios.get(
        '/computer/api/json?tree=computer[displayName,description,offline,temporarilyOffline,monitorData]'
      );
      return response.data.computer || [];
    } catch (error: any) {
      console.error('Error getting Jenkins nodes:', error);
      throw new Error(`Failed to get nodes: ${error.message || 'Unknown error'}`);
    }
  }
  
  // Get queue information
  async getQueue(): Promise<JenkinsQueue> {
    try {
      const response = await this.axios.get(
        '/queue/api/json?tree=items[id,task[name,url],stuck,why,buildableStartMilliseconds]'
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting Jenkins queue:', error);
      throw new Error(`Failed to get queue: ${error.message || 'Unknown error'}`);
    }
  }
  
  // Get system statistics
  async getSystemStats(): Promise<any> {
    try {
      // Get overall load statistics
      const loadStats = await this.axios.get('/overallLoad/api/json');
      
      // Get executor information
      const executorInfo = await this.axios.get('/computer/api/json?tree=computer[displayName,executors[idle,likelyStuck,progress]]');
      
      // Get nodes
      const nodes = await this.getNodes();
      
      return {
        loadStats: loadStats.data,
        executorInfo: executorInfo.data,
        nodes
      };
    } catch (error: any) {
      console.error('Error getting Jenkins system stats:', error);
      throw new Error(`Failed to get system stats: ${error.message || 'Unknown error'}`);
    }
  }
  
  // Analyze common issues
  async analyzeIssues(): Promise<any> {
    try {
      // Get recent builds to analyze for issues
      const jobs = await this.getJobs();
      const issuesFound = [];
      
      // Analyze first 10 jobs for issues
      const jobsToAnalyze = jobs.slice(0, 10);
      
      for (const job of jobsToAnalyze) {
        try {
          const jobDetails = await this.getJobDetails(job.name);
          if (jobDetails.lastBuild) {
            const builds = await this.getBuilds(job.name, 5);
            
            // Check for failed builds
            const failedBuilds = builds.filter(build => build.result === 'FAILURE');
            if (failedBuilds.length > 0) {
              issuesFound.push({
                type: 'Build Failure',
                job: job.name,
                build: `#${failedBuilds[0].number}`,
                time: new Date(failedBuilds[0].timestamp).toLocaleString(),
                severity: failedBuilds.length > 2 ? 'high' : 'medium',
                url: failedBuilds[0].url
              });
            }
            
            // Check for long-running builds
            const longRunningBuilds = builds.filter(build => build.building && (Date.now() - build.timestamp > 3600000));
            if (longRunningBuilds.length > 0) {
              issuesFound.push({
                type: 'Stuck Build',
                job: job.name,
                build: `#${longRunningBuilds[0].number}`,
                time: new Date(longRunningBuilds[0].timestamp).toLocaleString(),
                severity: 'high',
                url: longRunningBuilds[0].url
              });
            }
          }
        } catch (error) {
          console.error(`Error analyzing job ${job.name}:`, error);
        }
      }
      
      // Check queue for stuck items
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
      
      return {
        issues: issuesFound,
        summary: {
          buildFailures: issuesFound.filter(issue => issue.type === 'Build Failure').length,
          stuckBuilds: issuesFound.filter(issue => issue.type === 'Stuck Build').length,
          queueIssues: issuesFound.filter(issue => issue.type === 'Stuck in Queue').length
        },
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('Error analyzing Jenkins issues:', error);
      throw new Error(`Failed to analyze issues: ${error.message || 'Unknown error'}`);
    }
  }
}

export { JenkinsServerApiClient };