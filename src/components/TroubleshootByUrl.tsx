'use client';

import React, { useState } from 'react';
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
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post('/api/jenkins/troubleshoot-url', {
        connection: activeConnection,
        url
      });
      
      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.error || 'Failed to troubleshoot the URL');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
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