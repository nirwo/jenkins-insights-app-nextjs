import { NextRequest, NextResponse } from 'next/server';
import JenkinsApiClient from '@/lib/jenkins-api';
import { maskSensitiveData } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connection, jobName, buildNumber } = body;
    
    if (!connection || !jobName || !buildNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: connection, jobName, or buildNumber' },
        { status: 400 }
      );
    }
    
    const client = new JenkinsApiClient(connection);
    
    // Get build console output
    const consoleOutput = await client.getBuildConsoleOutput(jobName, buildNumber);
    
    // Parse console output for errors and exceptions
    const errors = parseConsoleForErrors(consoleOutput);
    
    // Mask sensitive information before returning
    const maskedConsoleOutput = maskSensitiveData(consoleOutput);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        consoleOutput: maskedConsoleOutput,
        errors
      }
    });
  } catch (error) {
    console.error('Error fetching console output:', error);
    return NextResponse.json(
      { error: 'Failed to fetch console output', details: error.message },
      { status: 500 }
    );
  }
}

// Function to parse console output for common errors and exceptions
function parseConsoleForErrors(consoleOutput: string): Array<{line: number, text: string, type: string, severity: string}> {
  const errors = [];
  const lines = consoleOutput.split('\n');
  
  // Common error patterns to look for - each with severity and more specific matches
  const errorPatterns = [
    // High severity patterns
    { regex: /exception in thread|java\.lang\.[a-z]+exception/i, type: 'java', severity: 'high' },
    { regex: /out of memory|java\.lang\.outofmemoryerror/i, type: 'memory', severity: 'high' },
    { regex: /fatal error|build failed|build terminated/i, type: 'build', severity: 'high' },
    { regex: /segmentation fault|core dumped/i, type: 'system', severity: 'high' },
    
    // Medium severity patterns
    { regex: /error:|failure:|failed:/i, type: 'general', severity: 'medium' },
    { regex: /npm err!|cannot find module|syntax error/i, type: 'javascript', severity: 'medium' },
    { regex: /importerror:|modulenotfounderror:|syntaxerror:/i, type: 'python', severity: 'medium' },
    { regex: /connection refused|timeout|unreachable/i, type: 'network', severity: 'medium' },
    { regex: /permission denied|access denied|unauthorized/i, type: 'permission', severity: 'medium' },
    
    // Low severity patterns
    { regex: /warning:|deprecated:/i, type: 'warning', severity: 'low' },
    { regex: /could not find|not found/i, type: 'missing', severity: 'low' }
  ];
  
  // Combine all patterns into a single regex for first-pass efficiency
  const combinedPattern = new RegExp(
    errorPatterns.map(pattern => pattern.regex.source).join('|'),
    'i'
  );
  
  // First, quickly filter lines that might contain errors
  const potentialErrorLines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => combinedPattern.test(line));
  
  // Then do detailed pattern matching only on the potential error lines
  potentialErrorLines.forEach(({ line, index }) => {
    for (const pattern of errorPatterns) {
      if (pattern.regex.test(line)) {
        errors.push({
          line: index + 1,
          text: line.trim(),
          type: pattern.type,
          severity: pattern.severity
        });
        break; // Only match one pattern per line
      }
    }
  });
  
  // Deduplicate similar errors that appear together (e.g., stack traces)
  const deduplicated = [];
  let lastType = '';
  let lastLineNum = 0;
  
  errors.forEach(error => {
    // If this is a similar error to the previous one and within 5 lines, skip it
    if (error.type === lastType && error.line - lastLineNum <= 5) {
      return;
    }
    
    deduplicated.push(error);
    lastType = error.type;
    lastLineNum = error.line;
  });
  
  return deduplicated;
}
