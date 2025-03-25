'use client';

import React, { useEffect, useState } from 'react';
import { useJenkins } from '@/lib/jenkins-context';
import axios from 'axios';

import { JenkinsJob } from '@/lib/jenkins-api';

// Custom hook for fetching Jenkins jobs
export const useJenkinsJobs = () => {
  const { activeConnection } = useJenkins();
  const [jobs, setJobs] = useState<JenkinsJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to memoize the fetch function
  const fetchJobs = React.useCallback(async () => {
    if (!activeConnection) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/jenkins/jobs', {
        connection: activeConnection
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      if (response.data.success) {
        setJobs(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch jobs');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while fetching jobs';
      console.error('Job fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection]);
  
  useEffect(() => {
    if (activeConnection) {
      fetchJobs();
    } else {
      // Reset state when connection changes to null
      setJobs([]);
      setError(null);
    }
  }, [activeConnection, fetchJobs]);
  
  // Add a manual refresh function
  const refreshJobs = () => {
    fetchJobs();
  };
  
  return { jobs, isLoading, error, refreshJobs };
};

// Custom hook for fetching job details
export const useJobDetails = (jobName: string) => {
  const { activeConnection } = useJenkins();
  const [jobDetails, setJobDetails] = useState<JenkinsJob | null>(null);
  const [builds, setBuilds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetails = React.useCallback(async () => {
    if (!activeConnection || !jobName) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/jenkins/job-details', {
        connection: activeConnection,
        jobName
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      if (response.data.success) {
        setJobDetails(response.data.data.jobDetails);
        setBuilds(response.data.data.builds);
      } else {
        setError(response.data.error || 'Failed to fetch job details');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while fetching job details';
      console.error(`Job details fetch error for ${jobName}:`, errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection, jobName]);
  
  useEffect(() => {
    if (activeConnection && jobName) {
      fetchJobDetails();
    } else {
      // Reset state when connection or jobName changes to null
      setJobDetails(null);
      setBuilds([]);
      setError(null);
    }
  }, [activeConnection, jobName, fetchJobDetails]);
  
  // Add a manual refresh function
  const refreshJobDetails = () => {
    fetchJobDetails();
  };
  
  return { jobDetails, builds, isLoading, error, refreshJobDetails };
};

// Custom hook for fetching system data
export const useSystemData = () => {
  const { activeConnection } = useJenkins();
  const [systemData, setSystemData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemData = React.useCallback(async () => {
    if (!activeConnection) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/jenkins/system-data', {
        connection: activeConnection
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      if (response.data.success) {
        setSystemData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch system data');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while fetching system data';
      console.error('System data fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection]);
  
  useEffect(() => {
    if (activeConnection) {
      fetchSystemData();
    } else {
      // Reset state when connection changes to null
      setSystemData(null);
      setError(null);
    }
  }, [activeConnection, fetchSystemData]);
  
  // Add a manual refresh function
  const refreshSystemData = () => {
    fetchSystemData();
  };
  
  return { systemData, isLoading, error, refreshSystemData };
};

// Custom hook for fetching console output
export const useConsoleOutput = (jobName: string, buildNumber: number) => {
  const { activeConnection } = useJenkins();
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [errors, setErrors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsoleOutput = React.useCallback(async () => {
    if (!activeConnection || !jobName || !buildNumber) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/jenkins/console-output', {
        connection: activeConnection,
        jobName,
        buildNumber
      }, {
        timeout: 60000 // 60 second timeout - console logs can be large
      });
      
      if (response.data.success) {
        setConsoleOutput(response.data.data.consoleOutput);
        setErrors(response.data.data.errors);
      } else {
        setError(response.data.error || 'Failed to fetch console output');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while fetching console output';
      console.error(`Console output fetch error for ${jobName} #${buildNumber}:`, errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection, jobName, buildNumber]);
  
  useEffect(() => {
    if (activeConnection && jobName && buildNumber) {
      fetchConsoleOutput();
    } else {
      // Reset state when params change to null/undefined
      setConsoleOutput('');
      setErrors([]);
      setError(null);
    }
  }, [activeConnection, jobName, buildNumber, fetchConsoleOutput]);
  
  // Add a manual refresh function
  const refreshConsoleOutput = () => {
    fetchConsoleOutput();
  };
  
  return { consoleOutput, errors, isLoading, error, refreshConsoleOutput };
};

// Custom hook for analyzing issues
export const useIssueAnalysis = () => {
  const { activeConnection } = useJenkins();
  const [issues, setIssues] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to memoize the function so it doesn't change on every render
  const analyzeIssues = React.useCallback(async () => {
    if (!activeConnection) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/jenkins/analyze-issues', {
        connection: activeConnection
      });
      
      if (response.data.success) {
        setIssues(response.data.data.issues);
        setSummary(response.data.data.summary);
      } else {
        setError(response.data.error || 'Failed to analyze issues');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing issues');
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection]); // Only recreate when activeConnection changes
  
  useEffect(() => {
    if (activeConnection) {
      analyzeIssues();
    }
  }, [activeConnection, analyzeIssues]);
  
  return { issues, summary, isLoading, error, refreshAnalysis: analyzeIssues };
};
