import { NextRequest, NextResponse } from 'next/server';
import { JenkinsServerApiClient } from '@/lib/jenkins-api-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connection } = body;
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Missing required field: connection' },
        { status: 400 }
      );
    }
    
    const client = new JenkinsServerApiClient(connection);
    
    // Analyze issues
    const analysisResult = await client.analyzeIssues();
    
    return NextResponse.json({ 
      success: true, 
      data: analysisResult
    });
  } catch (error) {
    console.error('Error analyzing Jenkins issues:', error);
    return NextResponse.json(
      { error: 'Failed to analyze issues', details: error.message },
      { status: 500 }
    );
  }
}
