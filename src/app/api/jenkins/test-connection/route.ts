import { NextRequest, NextResponse } from 'next/server';
import { JenkinsServerApiClient } from '@/lib/jenkins-api-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, username, token } = body;
    
    if (!url || !username || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: url, username, or token' },
        { status: 400 }
      );
    }
    
    const connection = { 
      id: Date.now().toString(), 
      name: 'Test Connection', 
      url, 
      authType: 'basic' as const, 
      username, 
      token 
    };
    const client = new JenkinsServerApiClient(connection);
    
    const isConnected = await client.testConnection();
    
    if (isConnected) {
      return NextResponse.json({ success: true, message: 'Connection successful' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to connect to Jenkins server' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing Jenkins connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection', details: error.message },
      { status: 500 }
    );
  }
}
