'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import JenkinsApiClient, { JenkinsConnection, AuthType } from '@/lib/jenkins-api';
import { encryptData, decryptData } from '@/lib/utils';

interface JenkinsContextType {
  connections: JenkinsConnection[];
  activeConnection: JenkinsConnection | null;
  client: JenkinsApiClient | null;
  isLoading: boolean;
  error: string | null;
  addConnection: (connection: JenkinsConnection) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (id: string) => void;
  testConnection: (connection: JenkinsConnection) => Promise<boolean>;
}

const JenkinsContext = createContext<JenkinsContextType | undefined>(undefined);

interface JenkinsProviderProps {
  children: ReactNode;
}

export const JenkinsProvider: React.FC<JenkinsProviderProps> = ({ children }) => {
  const [connections, setConnections] = useState<JenkinsConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<JenkinsConnection | null>(null);
  const [client, setClient] = useState<JenkinsApiClient | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load connections from localStorage on initial render
  useEffect(() => {
    const savedConnections = localStorage.getItem('jenkins-connections');
    if (savedConnections) {
      try {
        const parsed = JSON.parse(savedConnections);
        
        // Handle migration from old format to new format with authType and decrypt sensitive data
        const migratedConnections = parsed.map((conn: JenkinsConnection) => {
          // Decrypt sensitive data
          const decryptedConn = decryptConnectionData(conn);
          
          // Ensure all connections have a proper authType
          if (!decryptedConn.authType) {
            return {
              ...decryptedConn,
              authType: determineAuthType(decryptedConn)
            };
          }
          return decryptedConn;
        });
        
        setConnections(migratedConnections);
        
        // Set active connection if available
        const activeId = localStorage.getItem('jenkins-active-connection');
        if (activeId) {
          const active = migratedConnections.find((conn: JenkinsConnection) => conn.id === activeId);
          if (active) {
            // Create a new client with the decrypted connection
            setActiveConnection(active);
            setClient(new JenkinsApiClient(active));
          }
        }
      } catch (err: any) {
        console.error('Error loading connections from localStorage:', err);
        setError(`Failed to load saved connections: ${err?.message || 'Unknown error'}`);
      }
    }
  }, []);

  // Helper function to encrypt sensitive fields in connections
  const encryptConnectionData = (conn: JenkinsConnection): JenkinsConnection => {
    const encryptedConn = { ...conn };
    
    // Encrypt sensitive fields if they exist
    if (encryptedConn.token) {
      encryptedConn.token = encryptData(encryptedConn.token);
    }
    if (encryptedConn.password) {
      encryptedConn.password = encryptData(encryptedConn.password);
    }
    if (encryptedConn.ssoToken) {
      encryptedConn.ssoToken = encryptData(encryptedConn.ssoToken);
    }
    
    return encryptedConn;
  };

  // Helper function to decrypt sensitive fields in connections
  const decryptConnectionData = (conn: JenkinsConnection): JenkinsConnection => {
    const decryptedConn = { ...conn };
    
    // Decrypt sensitive fields if they exist
    if (decryptedConn.token) {
      decryptedConn.token = decryptData(decryptedConn.token);
    }
    if (decryptedConn.password) {
      decryptedConn.password = decryptData(decryptedConn.password);
    }
    if (decryptedConn.ssoToken) {
      decryptedConn.ssoToken = decryptData(decryptedConn.ssoToken);
    }
    
    return decryptedConn;
  };

  // Save connections to localStorage when they change
  useEffect(() => {
    if (connections.length > 0) {
      // Encrypt sensitive data before storing
      const encryptedConnections = connections.map(encryptConnectionData);
      localStorage.setItem('jenkins-connections', JSON.stringify(encryptedConnections));
    } else {
      localStorage.removeItem('jenkins-connections');
    }
  }, [connections]);

  // Save active connection to localStorage when it changes
  useEffect(() => {
    if (activeConnection) {
      localStorage.setItem('jenkins-active-connection', activeConnection.id);
    } else {
      localStorage.removeItem('jenkins-active-connection');
    }
  }, [activeConnection]);

  // Helper function to determine auth type
  const determineAuthType = (conn: JenkinsConnection): AuthType => {
    if (conn.authType) {
      return conn.authType;
    }
    
    // Default to BASIC if username and token are provided
    if (conn.username && conn.token) {
      return AuthType.BASIC;
    } 
    // Default to TOKEN if only token is provided
    else if (conn.token) {
      return AuthType.TOKEN;
    }
    // Default to SSO if ssoToken is provided
    else if (conn.ssoToken) {
      return AuthType.SSO;
    }
    // Default to BASIC_AUTH if username and password are provided
    else if (conn.username && conn.password) {
      return AuthType.BASIC_AUTH;
    }
    // Fallback to BASIC as default
    else {
      return AuthType.BASIC;
    }
  };

  const addConnection = (connection: JenkinsConnection) => {
    // Generate ID if not provided
    if (!connection.id) {
      connection.id = Date.now().toString();
    }
    
    // Ensure connection has authType
    connection.authType = determineAuthType(connection);
    
    setConnections(prev => [...prev, connection]);
    
    // If this is the first connection, set it as active
    if (connections.length === 0) {
      setActiveConnection(connection);
      setClient(new JenkinsApiClient(connection));
    }
  };

  const removeConnection = (id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id));
    
    // If removing the active connection, set active to null
    if (activeConnection && activeConnection.id === id) {
      setActiveConnection(null);
      setClient(null);
    }
  };

  const setActive = (id: string) => {
    const connection = connections.find(conn => conn.id === id);
    if (connection) {
      setActiveConnection(connection);
      setClient(new JenkinsApiClient(connection));
    } else {
      setError(`Connection with ID ${id} not found`);
    }
  };

  const testConnection = async (connection: JenkinsConnection): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    // Ensure connection has authType before testing
    connection.authType = determineAuthType(connection);
    
    try {
      const testClient = new JenkinsApiClient(connection);
      const result = await testClient.testConnection();
      setIsLoading(false);
      return result;
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err?.message || 'Failed to connect to Jenkins server';
      setError(errorMessage);
      return false;
    }
  };

  const value = {
    connections,
    activeConnection,
    client,
    isLoading,
    error,
    addConnection,
    removeConnection,
    setActiveConnection: setActive,
    testConnection
  };

  return (
    <JenkinsContext.Provider value={value}>
      {children}
    </JenkinsContext.Provider>
  );
};

export const useJenkins = (): JenkinsContextType => {
  const context = useContext(JenkinsContext);
  if (context === undefined) {
    throw new Error('useJenkins must be used within a JenkinsProvider');
  }
  return context;
};

export { AuthType };
