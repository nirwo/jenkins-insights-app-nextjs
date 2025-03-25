import { NextRequest, NextResponse } from 'next/server';
import { JenkinsServerApiClient } from '@/lib/jenkins-api-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connection } = body;
    
    if (!connection || !connection.url || !connection.authType) {
      return NextResponse.json(
        { error: 'Invalid connection details. Requires url and authType at minimum.' },
        { status: 400 }
      );
    }
    
    // Validate connection based on auth type
    const { authType } = connection;
    let isValidConnection = false;
    
    switch(authType) {
      case 'basic':
        isValidConnection = !!(connection.username && connection.token);
        break;
      case 'token':
        isValidConnection = !!connection.token;
        break;
      case 'sso':
        isValidConnection = !!connection.ssoToken || !!connection.cookieAuth;
        break;
      case 'basic_auth':
        isValidConnection = !!(connection.username && connection.password);
        break;
      default:
        isValidConnection = false;
    }
    
    if (!isValidConnection) {
      return NextResponse.json(
        { error: `Missing required credentials for ${authType} authentication` },
        { status: 400 }
      );
    }
    
    const client = new JenkinsServerApiClient(connection);
    
    // Get jobs with a timeout (30 seconds)
    const jobs = await client.getJobs();
    
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error('Error fetching Jenkins jobs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch jobs', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
