/**
 * Type definitions for Jenkins entities
 * This file can be used in both client and server components
 */

export enum AuthType {
  BASIC = 'basic',
  TOKEN = 'token',
  SSO = 'sso',
  BASIC_AUTH = 'basic_auth'
}

export interface JenkinsConnection {
  id: string;
  name: string;
  url: string;
  authType: AuthType;
  username?: string;
  token?: string;
  password?: string;
  ssoToken?: string;
  cookieAuth?: boolean;
  description?: string;
  color?: string;
  folder?: string;
}

export interface JenkinsJob {
  name: string;
  url: string;
  color: string;
  lastBuild?: JenkinsBuild;
  healthScore?: number;
  description?: string;
}

export interface JenkinsBuild {
  number: number;
  url: string;
  result: string;
  timestamp: number;
  duration: number;
  building: boolean;
}

export interface JenkinsNode {
  name: string;
  displayName: string;
  description: string;
  offline: boolean;
  temporarilyOffline: boolean;
  monitorData?: any;
}

export interface JenkinsQueue {
  items: JenkinsQueueItem[];
}

export interface JenkinsQueueItem {
  id: number;
  task: {
    name: string;
    url: string;
  };
  stuck: boolean;
  why: string;
  buildableStartMilliseconds: number;
}

export interface JenkinsPlugin {
  shortName: string;
  longName: string;
  version: string;
  active: boolean;
  enabled: boolean;
}

export interface JenkinsFolder {
  name: string;
  url: string;
  jobs: JenkinsJob[];
}