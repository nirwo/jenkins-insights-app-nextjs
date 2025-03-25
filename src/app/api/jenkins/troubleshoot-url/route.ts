import { NextRequest, NextResponse } from 'next/server';
import { JenkinsServerApiClient } from '@/lib/jenkins-api-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connection, url } = body;
    
    if (!connection || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: connection or url' },
        { status: 400 }
      );
    }
    
    const client = new JenkinsServerApiClient(connection);
    
    // Extract job name or build information from URL
    try {
      const jobInfo = await client.getJobInfoFromUrl(url);
      
      // Get job details
      const jobDetails = await client.getJobDetails(jobInfo.jobName);
      
      // Get recent builds
      const builds = await client.getBuilds(jobInfo.jobName, 5);
      
      // Get console output for the latest build if available
      let consoleOutput = null;
      let consoleErrors = [];
      
      if (jobDetails.lastBuild) {
        try {
          consoleOutput = await client.getBuildConsoleOutput(
            jobInfo.jobName, 
            jobDetails.lastBuild.number
          );
          
          // Parse console output for errors (simplified version)
          consoleErrors = parseConsoleForErrors(consoleOutput);
        } catch (err) {
          console.error('Error fetching console output:', err);
        }
      }
      
      return NextResponse.json({
        success: true,
        data: {
          jobDetails,
          builds,
          consoleOutput,
          consoleErrors
        }
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Could not extract job information from URL', details: error.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error troubleshooting Jenkins URL:', error);
    return NextResponse.json(
      { error: 'Failed to troubleshoot URL', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// Simplified function to parse console output for errors
function parseConsoleForErrors(consoleOutput: string): Array<{line: number, text: string, type: string, severity: string}> {
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