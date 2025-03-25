'use client';

import React, { useState, useEffect } from 'react';
import { useJenkins } from '@/lib/jenkins-context';
import { 
  Card, 
  Form, 
  Button, 
  Spinner, 
  Alert, 
  Table, 
  Badge, 
  Tabs, 
  Tab,
  ListGroup
} from 'react-bootstrap';
import axios from 'axios';
import { formatDate, formatDuration } from '@/lib/utils';

export default function TroubleshootByUrl() {
  const { activeConnection } = useJenkins();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  
  // Load recent URLs from localStorage on component mount
  useEffect(() => {
    try {
      const savedUrls = localStorage.getItem('recentJenkinsUrls');
      if (savedUrls) {
        setRecentUrls(JSON.parse(savedUrls));
      }
    } catch (err) {
      console.error('Error loading recent URLs:', err);
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeConnection) {
      setError('No active Jenkins connection. Please connect to a Jenkins server first.');
      return;
    }
    
    if (!url) {
      setError('Please enter a Jenkins URL to troubleshoot.');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://jenkins.example.com/job/my-job)');
      return;
    }
    
    // Check if URL looks like a Jenkins URL
    if (!url.includes('/job/') && !url.includes('/view/')) {
      setError('URL does not appear to be a Jenkins job URL. It should contain "/job/" in the path.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Troubleshooting URL:', url);
      const response = await axios.post('/api/jenkins/troubleshoot-url', {
        connection: activeConnection,
        url
      }, {
        timeout: 60000 // Longer timeout for potentially slow Jenkins servers
      });
      
      if (response.data.success) {
        console.log('Troubleshooting result:', response.data.data);
        setResult(response.data.data);
        
        // Save URL to recent URLs
        const updatedRecentUrls = [url, ...recentUrls.filter(u => u !== url)].slice(0, 5);
        setRecentUrls(updatedRecentUrls);
        localStorage.setItem('recentJenkinsUrls', JSON.stringify(updatedRecentUrls));
      } else {
        console.error('Troubleshooting error:', response.data.error);
        setError(response.data.error || 'Failed to troubleshoot the URL');
      }
    } catch (err: any) {
      console.error('Request error:', err);
      
      // Handle specific error cases
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The Jenkins server might be slow or unresponsive.');
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Please ensure the application is properly configured.');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.error || 'Invalid request. The URL might not be a valid Jenkins job URL.');
      } else {
        setError(err.response?.data?.error || err.message || 'An error occurred while troubleshooting the URL');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const getBuildStatusBadge = (status?: string) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;
    
    const statusMap: Record<string, { bg: string; text: string }> = {
      'SUCCESS': { bg: 'success', text: 'Success' },
      'FAILURE': { bg: 'danger', text: 'Failed' },
      'UNSTABLE': { bg: 'warning', text: 'Unstable' },
      'ABORTED': { bg: 'secondary', text: 'Aborted' },
      'IN_PROGRESS': { bg: 'info', text: 'In Progress' },
      'NOT_BUILT': { bg: 'light', text: 'Not Built' },
      'blue': { bg: 'success', text: 'Success' },
      'red': { bg: 'danger', text: 'Failed' },
      'yellow': { bg: 'warning', text: 'Unstable' },
      'grey': { bg: 'secondary', text: 'Aborted' },
      'disabled': { bg: 'light', text: 'Disabled' },
      'blue_anime': { bg: 'info', text: 'Running' },
      'red_anime': { bg: 'info', text: 'Running' },
      'yellow_anime': { bg: 'info', text: 'Running' },
      'grey_anime': { bg: 'info', text: 'Running' }
    };
    
    const config = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4 className="mb-0">
          <i className="bi bi-link-45deg me-2"></i> 
          Troubleshoot by URL
        </h4>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Jenkins URL</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="url"
                placeholder="https://jenkins.example.com/job/my-job"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                variant="primary" 
                className="ms-2" 
                disabled={isLoading || !activeConnection}
              >
                {isLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="bi bi-search"></i>
                )}
              </Button>
            </div>
            <Form.Text className="text-muted">
              Enter a Jenkins job or build URL to troubleshoot
            </Form.Text>
          </Form.Group>
          
          {/* Recent URLs */}
          {recentUrls.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">Recent URLs:</small>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {recentUrls.map((recentUrl, index) => (
                  <Button 
                    key={index}
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setUrl(recentUrl)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {new URL(recentUrl).pathname.split('/').slice(-2).join('/')}
                  </Button>
                ))}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('recentJenkinsUrls');
                    setRecentUrls([]);
                  }}
                  style={{ fontSize: '0.8rem' }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </Form>
        
        {error && (
          <Alert variant="danger" className="mt-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {isLoading && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Analyzing Jenkins URL...</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4">
            <h5>
              <i className="bi bi-wrench me-2"></i>
              Troubleshooting Results
            </h5>
            
            <Card className="bg-light mb-3">
              <Card.Body>
                <div className="mb-2">
                  <strong>Job Name:</strong> {result.jobDetails.name}
                </div>
                <div className="mb-2">
                  <strong>Status:</strong> {getBuildStatusBadge(result.jobDetails.color)}
                </div>
                {result.jobDetails.lastBuild && (
                  <div className="mb-2">
                    <strong>Last Build:</strong> #{result.jobDetails.lastBuild.number} ({formatDate(result.jobDetails.lastBuild.timestamp)})
                  </div>
                )}
                <div>
                  <strong>URL:</strong> <a href={result.jobDetails.url} target="_blank" rel="noopener noreferrer">{result.jobDetails.url}</a>
                </div>
              </Card.Body>
            </Card>
            
            <Tabs defaultActiveKey="builds" className="mb-3">
              <Tab eventKey="builds" title="Recent Builds">
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Build</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.builds && result.builds.length > 0 ? (
                      result.builds.map((build: any) => (
                        <tr key={build.number}>
                          <td>#{build.number}</td>
                          <td>{getBuildStatusBadge(build.result)}</td>
                          <td>{formatDate(build.timestamp)}</td>
                          <td>{formatDuration(build.duration)}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              href={build.url} 
                              target="_blank"
                            >
                              <i className="bi bi-box-arrow-up-right me-1"></i>
                              Open
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center">No builds found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Tab>
              
              <Tab eventKey="errors" title="Detected Issues">
                {result.consoleErrors && result.consoleErrors.length > 0 ? (
                  <ListGroup variant="flush">
                    {result.consoleErrors.map((error: any, index: number) => (
                      <ListGroup.Item key={index} className="d-flex align-items-start">
                        <Badge 
                          bg={
                            error.severity === 'high' ? 'danger' : 
                            error.severity === 'medium' ? 'warning' : 'info'
                          }
                          className="me-2"
                        >
                          Line {error.line}
                        </Badge>
                        <div>
                          <div className="mb-1">
                            <Badge bg="secondary">{error.type}</Badge>
                          </div>
                          <code className="d-block text-break">{error.text}</code>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    No issues detected in the console output.
                  </Alert>
                )}
              </Tab>
              
              <Tab eventKey="console" title="Console Output" disabled={!result.consoleOutput}>
                {result.consoleOutput ? (
                  <div className="bg-dark text-light p-3 rounded" style={{ maxHeight: '500px', overflow: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {result.consoleOutput}
                    </pre>
                  </div>
                ) : (
                  <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    No console output available.
                  </Alert>
                )}
              </Tab>
            </Tabs>
            
            <div className="mt-3">
              <Button variant="outline-primary" size="sm" href={`/jobs/${encodeURIComponent(result.jobDetails.name)}`}>
                <i className="bi bi-tools me-1"></i>
                View Detailed Analysis
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}