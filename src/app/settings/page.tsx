'use client';

import React, { useState } from 'react';
import { Card, Button, ListGroup, Badge, Alert, Modal, Row, Col } from 'react-bootstrap';
import { useJenkins, AuthType } from '@/lib/jenkins-context';
import Layout from '@/components/Layout';
import dynamic from 'next/dynamic';

// Dynamically import the wizard for client-side only rendering
const JenkinsConnectionWizard = dynamic(() => import('@/components/JenkinsConnectionWizard'), {
  ssr: false
});

export default function Settings() {
  const { 
    connections, 
    activeConnection, 
    setActiveConnection, 
    removeConnection 
  } = useJenkins();
  
  const [showWizard, setShowWizard] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);
  
  // Group connections by folder
  const connectionsByFolder = connections.reduce((grouped: Record<string, any[]>, conn) => {
    const folder = conn.folder || 'Default';
    if (!grouped[folder]) {
      grouped[folder] = [];
    }
    grouped[folder].push(conn);
    return grouped;
  }, {});
  
  const handleDeleteConnection = (id: string) => {
    setConnectionToDelete(id);
    setShowConfirmDelete(true);
  };
  
  const confirmDelete = () => {
    if (connectionToDelete) {
      removeConnection(connectionToDelete);
      setConnectionToDelete(null);
    }
    setShowConfirmDelete(false);
  };
  
  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-gear-fill me-2"></i>Settings</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowWizard(true)}
          className="d-flex align-items-center"
        >
          <i className="bi bi-plus-circle-fill me-2"></i>
          Add Connection
        </Button>
      </div>
      
      {/* Connection Wizard Modal */}
      <Modal 
        show={showWizard} 
        onHide={() => setShowWizard(false)}
        size="lg"
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Jenkins Connection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <JenkinsConnectionWizard
            onComplete={() => setShowWizard(false)}
          />
        </Modal.Body>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this Jenkins connection?</p>
          <p className="mb-0 text-danger"><strong>This action cannot be undone.</strong></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Connection
          </Button>
        </Modal.Footer>
      </Modal>
      
      {connections.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <i className="bi bi-server text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3">No Jenkins Connections</h4>
            <p className="text-muted mb-4">
              Add your first Jenkins connection to start monitoring your CI/CD pipelines.
            </p>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => setShowWizard(true)}
              className="px-4"
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Jenkins Connection
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Jenkins Connections</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                {Object.entries(connectionsByFolder).map(([folder, folderConnections]) => (
                  <Col md={6} className="mb-4" key={folder}>
                    <Card>
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          {folder === 'Default' ? (
                            <><i className="bi bi-folder me-2"></i>Default</>
                          ) : (
                            <><i className="bi bi-folder-fill me-2"></i>{folder}</>
                          )}
                        </h5>
                        <Badge bg="info">{folderConnections.length}</Badge>
                      </Card.Header>
                      <ListGroup variant="flush">
                        {folderConnections.map(conn => (
                          <ListGroup.Item 
                            key={conn.id}
                            action
                            active={activeConnection?.id === conn.id}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div onClick={() => setActiveConnection(conn.id)} style={{ cursor: 'pointer', flex: 1 }}>
                              <div className="d-flex align-items-center">
                                <Badge 
                                  bg={conn.color || 'primary'} 
                                  className="me-2"
                                >
                                  {conn.name.charAt(0).toUpperCase()}
                                </Badge>
                                <div>
                                  <div className="fw-bold">{conn.name}</div>
                                  <div className="small text-muted">{conn.url}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="d-flex">
                              {activeConnection?.id === conn.id && (
                                <Badge bg="success" className="me-2">Active</Badge>
                              )}
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => handleDeleteConnection(conn.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h4 className="mb-0">Help & Information</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" className="mb-3">
                <h5><i className="bi bi-info-circle me-2"></i>Using Multiple Jenkins Connections</h5>
                <p className="mb-0">
                  You can manage multiple Jenkins connections and switch between them at any time.
                  The active connection is used for all dashboard and troubleshooting features.
                </p>
              </Alert>
              
              <div className="mb-3">
                <h5><i className="bi bi-shield-lock me-2"></i>About Authentication</h5>
                <p>
                  Jenkins Insights supports several authentication methods:
                </p>
                <ul>
                  <li><strong>API Token:</strong> Username + API token (recommended)</li>
                  <li><strong>Bearer Token:</strong> For OAuth or custom auth systems</li>
                  <li><strong>SSO Authentication:</strong> For single sign-on systems</li>
                  <li><strong>Username & Password:</strong> Basic authentication (less secure)</li>
                </ul>
                <p className="small text-muted">
                  All credentials are encrypted before being stored in your browser's local storage.
                </p>
              </div>
              
              <div>
                <h5><i className="bi bi-puzzle me-2"></i>Additional Configuration</h5>
                <p>
                  For advanced configuration options, check our documentation:
                </p>
                <ul>
                  <li>Custom API endpoints</li>
                  <li>Proxy configuration</li>
                  <li>Webhook integration</li>
                  <li>Data retention policies</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </Layout>
  );
}