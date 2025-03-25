'use client';

import React, { useState } from 'react';
import { useJenkins } from '@/lib/jenkins-context';
import { AuthType } from '@/lib/jenkins-types';
import { 
  Card, 
  Button, 
  Form, 
  Spinner, 
  ProgressBar, 
  Alert, 
  Badge,
  Row,
  Col
} from 'react-bootstrap';

// Define wizard steps
const WIZARD_STEPS = {
  BASIC_INFO: 0,
  AUTH_SELECTION: 1,
  AUTH_DETAILS: 2,
  VERIFICATION: 3,
  COMPLETE: 4
};

// Define Auth Type constants for reliability (fallback if enum import fails)
const AUTH_TYPES = {
  BASIC: 'basic',
  TOKEN: 'token',
  SSO: 'sso',
  BASIC_AUTH: 'basic_auth'
};

const FOLDER_OPTIONS = [
  { name: 'None', value: '' },
  { name: 'Development', value: 'dev' },
  { name: 'Production', value: 'prod' },
  { name: 'Testing', value: 'test' },
  { name: 'CI/CD', value: 'cicd' },
  { name: 'Custom', value: 'custom' }
];

const COLOR_OPTIONS = [
  { name: 'Blue (Default)', value: 'primary' },
  { name: 'Green', value: 'success' },
  { name: 'Red', value: 'danger' },
  { name: 'Yellow', value: 'warning' },
  { name: 'Gray', value: 'secondary' },
  { name: 'Purple', value: 'purple' }
];

interface JenkinsConnectionWizardProps {
  onComplete?: () => void;
}

export default function JenkinsConnectionWizard({ onComplete }: JenkinsConnectionWizardProps) {
  const { addConnection, testConnection } = useJenkins();
  const [currentStep, setCurrentStep] = useState(WIZARD_STEPS.BASIC_INFO);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Form state with explicitly initialized values for all fields
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    color: 'primary',
    folder: '',
    customFolder: '',
    // Use the fallback AUTH_TYPES constant instead of potentially undefined enum
    authType: AUTH_TYPES.BASIC,
    // Initialize all auth fields with empty strings
    username: '',
    token: '',
    password: '',
    ssoToken: '',
    cookieAuth: false
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox type
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.COMPLETE) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > WIZARD_STEPS.BASIC_INFO) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Create connection object for testing with explicit properties
      const connectionForTest: any = {
        id: Date.now().toString(),
        name: formData.name,
        url: formData.url,
        // Ensure authType is a string value
        authType: formData.authType.toString(),
        description: formData.description || undefined,
        color: formData.color,
        folder: formData.folder === 'custom' ? formData.customFolder : formData.folder
      };
      
      // Add the specific auth properties based on the auth type
      switch (formData.authType) {
        case AUTH_TYPES.BASIC:
          connectionForTest.username = formData.username;
          connectionForTest.token = formData.token;
          break;
        case AUTH_TYPES.TOKEN:
          connectionForTest.token = formData.token;
          break;
        case AUTH_TYPES.SSO:
          connectionForTest.ssoToken = formData.ssoToken;
          connectionForTest.cookieAuth = formData.cookieAuth;
          break;
        case AUTH_TYPES.BASIC_AUTH:
          connectionForTest.username = formData.username;
          connectionForTest.password = formData.password;
          break;
      }
      
      // For debugging - remove in production
      console.log('Testing connection:', connectionForTest);
      
      const success = await testConnection(connectionForTest);
      
      if (success) {
        setTestResult({
          success: true,
          message: 'Connection successful! Jenkins server is reachable.'
        });
        // Auto advance after success
        setTimeout(() => setCurrentStep(WIZARD_STEPS.COMPLETE), 1000);
      } else {
        setTestResult({
          success: false,
          message: 'Connection failed. Please check your credentials and try again.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error testing connection. Please check your settings and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = () => {
    // Create final connection object with all required properties
    const newConnection: any = {
      id: Date.now().toString(),
      name: formData.name,
      url: formData.url,
      // Ensure authType is a string value, not an enum reference
      authType: formData.authType.toString(),
      description: formData.description || undefined,
      color: formData.color,
      folder: formData.folder === 'custom' ? formData.customFolder : formData.folder
    };
    
    // Explicitly add auth-specific properties
    switch (formData.authType) {
      case AUTH_TYPES.BASIC:
        newConnection.username = formData.username;
        newConnection.token = formData.token;
        break;
      case AUTH_TYPES.TOKEN:
        newConnection.token = formData.token;
        break;
      case AUTH_TYPES.SSO:
        newConnection.ssoToken = formData.ssoToken;
        newConnection.cookieAuth = formData.cookieAuth;
        break;
      case AUTH_TYPES.BASIC_AUTH:
        newConnection.username = formData.username;
        newConnection.password = formData.password;
        break;
    }
    
    // For debugging - remove in production
    console.log('Adding connection:', newConnection);
    
    // Add the connection
    addConnection(newConnection);
    
    // Callback if provided
    if (onComplete) {
      onComplete();
    }
  };
  
  const validateCurrentStep = () => {
    switch (currentStep) {
      case WIZARD_STEPS.BASIC_INFO:
        return formData.name.trim() !== '' && formData.url.trim() !== '';
      case WIZARD_STEPS.AUTH_SELECTION:
        return true; // Auth type is always selected
      case WIZARD_STEPS.AUTH_DETAILS:
        switch (formData.authType) {
          case AUTH_TYPES.BASIC:
            return formData.username.trim() !== '' && formData.token.trim() !== '';
          case AUTH_TYPES.TOKEN:
            return formData.token.trim() !== '';
          case AUTH_TYPES.SSO:
            return formData.ssoToken.trim() !== '';
          case AUTH_TYPES.BASIC_AUTH:
            return formData.username.trim() !== '' && formData.password.trim() !== '';
          default:
            return false;
        }
      case WIZARD_STEPS.VERIFICATION:
        return testResult?.success || false;
      default:
        return true;
    }
  };
  
  const renderProgressBar = () => {
    const totalSteps = Object.keys(WIZARD_STEPS).length - 1; // -1 because COMPLETE is not shown
    const progress = ((currentStep + 1) / totalSteps) * 100;
    
    return (
      <div className="mb-4">
        <ProgressBar 
          now={progress} 
          label={`Step ${currentStep + 1} of ${totalSteps}`} 
          variant="primary" 
          className="mb-2"
        />
        <div className="d-flex justify-content-between">
          <span>Basic Info</span>
          <span>Authentication</span>
          <span>Details</span>
          <span>Verification</span>
        </div>
      </div>
    );
  };
  
  const renderBasicInfoStep = () => (
    <>
      <h4 className="mb-4">Jenkins Connection Details</h4>
      
      <Form.Group className="mb-3">
        <Form.Label>Connection Name*</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Production Jenkins"
          required
        />
        <Form.Text className="text-muted">
          A name to identify this Jenkins server
        </Form.Text>
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Jenkins URL*</Form.Label>
        <Form.Control
          type="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          placeholder="https://jenkins.example.com"
          required
        />
        <Form.Text className="text-muted">
          Full URL to your Jenkins server
        </Form.Text>
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description of this Jenkins server"
          rows={2}
        />
      </Form.Group>
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Folder (Optional)</Form.Label>
            <Form.Select 
              name="folder"
              value={formData.folder}
              onChange={handleChange}
            >
              {FOLDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Group connections by folder
            </Form.Text>
          </Form.Group>
          
          {formData.folder === 'custom' && (
            <Form.Group className="mt-2">
              <Form.Control
                type="text"
                name="customFolder"
                value={formData.customFolder}
                onChange={handleChange}
                placeholder="Custom folder name"
              />
            </Form.Group>
          )}
        </Col>
        
        <Col md={6}>
          <Form.Group>
            <Form.Label>Color Tag</Form.Label>
            <Form.Select 
              name="color"
              value={formData.color}
              onChange={handleChange}
            >
              {COLOR_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Visual indicator for this connection
            </Form.Text>
          </Form.Group>
          <div className="mt-2">
            Selected color: <Badge bg={formData.color}>{formData.name || 'Connection'}</Badge>
          </div>
        </Col>
      </Row>
    </>
  );
  
  const renderAuthSelectionStep = () => (
    <>
      <h4 className="mb-4">Authentication Method</h4>
      
      <div className="mb-4">
        <p>Select the authentication method for your Jenkins server:</p>
        
        <div className="d-grid gap-2">
          <Button 
            variant={formData.authType === AUTH_TYPES.BASIC ? 'primary' : 'outline-primary'}
            className="text-start p-3"
            onClick={() => setFormData(prev => ({ ...prev, authType: AUTH_TYPES.BASIC }))}
          >
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className="bi bi-key-fill fs-3"></i>
              </div>
              <div>
                <strong>API Token</strong>
                <div className="text-muted">Username and API token authentication (recommended)</div>
              </div>
            </div>
          </Button>
          
          <Button 
            variant={formData.authType === AUTH_TYPES.TOKEN ? 'primary' : 'outline-primary'}
            className="text-start p-3"
            onClick={() => setFormData(prev => ({ ...prev, authType: AUTH_TYPES.TOKEN }))}
          >
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className="bi bi-shield-lock-fill fs-3"></i>
              </div>
              <div>
                <strong>Bearer Token</strong>
                <div className="text-muted">Authentication with a Bearer token</div>
              </div>
            </div>
          </Button>
          
          <Button 
            variant={formData.authType === AUTH_TYPES.SSO ? 'primary' : 'outline-primary'}
            className="text-start p-3"
            onClick={() => setFormData(prev => ({ ...prev, authType: AUTH_TYPES.SSO }))}
          >
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className="bi bi-person-badge-fill fs-3"></i>
              </div>
              <div>
                <strong>SSO Authentication</strong>
                <div className="text-muted">Single sign-on or cookie-based authentication</div>
              </div>
            </div>
          </Button>
          
          <Button 
            variant={formData.authType === AUTH_TYPES.BASIC_AUTH ? 'primary' : 'outline-primary'}
            className="text-start p-3"
            onClick={() => setFormData(prev => ({ ...prev, authType: AUTH_TYPES.BASIC_AUTH }))}
          >
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className="bi bi-person-fill-lock fs-3"></i>
              </div>
              <div>
                <strong>Username & Password</strong>
                <div className="text-muted">Basic authentication with username and password</div>
              </div>
            </div>
          </Button>
        </div>
      </div>
    </>
  );
  
  const renderAuthDetailsStep = () => {
    switch (formData.authType) {
      case AuthType.BASIC:
        return (
          <>
            <h4 className="mb-4">API Token Authentication</h4>
            
            <Alert variant="info">
              <p className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <strong>API Tokens</strong> can be generated in Jenkins by going to:
                <br />
                Your username → Configure → API Token → Add new Token
              </p>
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>Username*</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Jenkins username"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>API Token*</Form.Label>
              <Form.Control
                type="password"
                name="token"
                value={formData.token}
                onChange={handleChange}
                placeholder="Jenkins API token"
                required
              />
              <Form.Text className="text-muted">
                Your token will be stored securely and never shared
              </Form.Text>
            </Form.Group>
          </>
        );
        
      case AuthType.TOKEN:
        return (
          <>
            <h4 className="mb-4">Bearer Token Authentication</h4>
            
            <Alert variant="info">
              <p className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Bearer tokens are typically used with OAuth or custom authentication systems.
              </p>
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>Bearer Token*</Form.Label>
              <Form.Control
                type="password"
                name="token"
                value={formData.token}
                onChange={handleChange}
                placeholder="Bearer token"
                required
              />
              <Form.Text className="text-muted">
                Your token will be stored securely and never shared
              </Form.Text>
            </Form.Group>
          </>
        );
        
      case AuthType.SSO:
        return (
          <>
            <h4 className="mb-4">SSO Authentication</h4>
            
            <Alert variant="info">
              <p className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                SSO authentication typically requires a token from your identity provider.
              </p>
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>SSO Token*</Form.Label>
              <Form.Control
                type="password"
                name="ssoToken"
                value={formData.ssoToken}
                onChange={handleChange}
                placeholder="SSO token"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="cookie-auth"
                name="cookieAuth"
                checked={formData.cookieAuth}
                onChange={handleChange}
                label="Enable cookie-based authentication"
              />
              <Form.Text className="text-muted">
                Enable this if your Jenkins server uses cookies for authentication
              </Form.Text>
            </Form.Group>
          </>
        );
        
      case AuthType.BASIC_AUTH:
        return (
          <>
            <h4 className="mb-4">Username & Password Authentication</h4>
            
            <Alert variant="warning">
              <p className="mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Using password authentication is less secure than API tokens.
                Consider using API tokens instead if possible.
              </p>
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>Username*</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Jenkins username"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password*</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Jenkins password"
                required
              />
              <Form.Text className="text-muted">
                Your password will be stored securely and never shared
              </Form.Text>
            </Form.Group>
          </>
        );
        
      default:
        return null;
    }
  };
  
  const renderVerificationStep = () => (
    <>
      <h4 className="mb-4">Verify Connection</h4>
      
      <div className="mb-4">
        <p>
          Let's verify that we can connect to your Jenkins server with the provided credentials:
        </p>
        
        <Card className="bg-light mb-4">
          <Card.Body>
            <div className="mb-2">
              <strong>Name:</strong> {formData.name}
            </div>
            <div className="mb-2">
              <strong>URL:</strong> {formData.url}
            </div>
            <div className="mb-2">
              <strong>Authentication:</strong> {
                {
                  [AuthType.BASIC]: 'API Token (Username & Token)',
                  [AuthType.TOKEN]: 'Bearer Token',
                  [AuthType.SSO]: 'SSO Authentication',
                  [AuthType.BASIC_AUTH]: 'Username & Password'
                }[formData.authType]
              }
            </div>
            {formData.folder && (
              <div className="mb-2">
                <strong>Folder:</strong> {formData.folder === 'custom' ? formData.customFolder : formData.folder}
              </div>
            )}
            <div>
              <strong>Color:</strong> <Badge bg={formData.color}>{formData.name}</Badge>
            </div>
          </Card.Body>
        </Card>
        
        {testResult && (
          <Alert variant={testResult.success ? 'success' : 'danger'}>
            <Alert.Heading>
              {testResult.success ? (
                <><i className="bi bi-check-circle-fill me-2"></i>Success!</>
              ) : (
                <><i className="bi bi-x-circle-fill me-2"></i>Connection Failed</>
              )}
            </Alert.Heading>
            <p>{testResult.message}</p>
          </Alert>
        )}
        
        <div className="d-grid gap-2">
          <Button 
            variant="primary" 
            onClick={handleTestConnection}
            disabled={isLoading || !validateCurrentStep()}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Testing Connection...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-check me-2"></i>
                Test Connection
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
  
  const renderCompleteStep = () => (
    <>
      <div className="text-center">
        <div className="mb-4">
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
        </div>
        
        <h4 className="mb-3">Jenkins Connection Ready!</h4>
        
        <p className="mb-4">
          Your connection to <strong>{formData.name}</strong> has been set up successfully.
          You can now start monitoring your Jenkins server.
        </p>
        
        <div className="d-grid gap-2">
          <Button variant="primary" onClick={handleSave}>
            <i className="bi bi-lightning-fill me-2"></i>
            Start Using Jenkins Insights
          </Button>
        </div>
      </div>
    </>
  );
  
  const renderStepContent = () => {
    switch (currentStep) {
      case WIZARD_STEPS.BASIC_INFO:
        return renderBasicInfoStep();
      case WIZARD_STEPS.AUTH_SELECTION:
        return renderAuthSelectionStep();
      case WIZARD_STEPS.AUTH_DETAILS:
        return renderAuthDetailsStep();
      case WIZARD_STEPS.VERIFICATION:
        return renderVerificationStep();
      case WIZARD_STEPS.COMPLETE:
        return renderCompleteStep();
      default:
        return null;
    }
  };
  
  const renderNavButtons = () => {
    if (currentStep === WIZARD_STEPS.COMPLETE) {
      return null;
    }
    
    return (
      <div className="d-flex justify-content-between mt-4">
        <Button 
          variant="outline-secondary" 
          onClick={handleBack}
          disabled={currentStep === WIZARD_STEPS.BASIC_INFO}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </Button>
        
        <Button 
          variant="primary" 
          onClick={handleNext}
          disabled={!validateCurrentStep() || (currentStep === WIZARD_STEPS.VERIFICATION && !testResult?.success)}
        >
          {currentStep === WIZARD_STEPS.VERIFICATION ? (
            <>
              <i className="bi bi-check-lg me-2"></i>
              Finish
            </>
          ) : (
            <>
              Next
              <i className="bi bi-arrow-right ms-2"></i>
            </>
          )}
        </Button>
      </div>
    );
  };
  
  return (
    <Card>
      <Card.Header className="bg-primary text-white">
        <h3 className="mb-0">
          <i className="bi bi-wrench-adjustable me-2"></i>
          Add Jenkins Connection
        </h3>
      </Card.Header>
      <Card.Body>
        {renderProgressBar()}
        {renderStepContent()}
        {renderNavButtons()}
      </Card.Body>
    </Card>
  );
}