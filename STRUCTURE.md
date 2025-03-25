# Jenkins Insights App - Project Structure

This document provides an overview of the project structure to help developers understand the codebase.

## Directory Structure

```
/
├── public/             # Static assets
├── src/                # Source code
│   ├── app/            # Next.js App Router pages
│   │   ├── api/        # API routes
│   │   │   └── jenkins/# Jenkins API endpoints
│   │   ├── jobs/       # Job listing and details pages
│   │   ├── settings/   # Settings page
│   │   ├── troubleshooting/ # Troubleshooting pages
│   │   └── page.tsx    # Dashboard page
│   ├── components/     # React components
│   │   ├── ui/         # UI components (buttons, cards, etc.)
│   │   └── Layout.tsx  # Main layout component
│   ├── hooks/          # React hooks
│   │   └── useJenkinsData.ts # Jenkins data fetching hooks
│   └── lib/            # Utilities and services
│       ├── jenkins-api.ts    # Jenkins API client
│       ├── jenkins-context.tsx # Jenkins context provider
│       └── utils.ts    # Utility functions
├── tests/              # Test files
├── migrations/         # Database migrations
├── deploy.sh           # Unix deployment script
├── deploy.bat          # Windows deployment script
├── jest.config.js      # Jest configuration
└── package.json        # Project dependencies
```

## Key Components

### API Client
`src/lib/jenkins-api.ts` - Core API client that handles all communication with Jenkins servers. Includes:
- Authentication handling for different auth types
- Request/response handling
- Caching layer
- Retry mechanisms
- API endpoint implementations

### Context Provider
`src/lib/jenkins-context.tsx` - React context that provides Jenkins connection management:
- Connection storage and encryption
- Active connection management
- Connection testing

### Data Hooks
`src/hooks/useJenkinsData.ts` - React hooks for fetching and managing Jenkins data:
- Jobs listing
- Job details
- Build console output
- System metrics
- Issue analysis

### API Routes
`src/app/api/jenkins/` - Server-side API routes that proxy requests to Jenkins:
- Connection validation
- Error handling
- Response formatting
- Sensitive data masking

### UI Pages
- `src/app/page.tsx` - Dashboard with system overview
- `src/app/jobs/page.tsx` - Jobs listing page
- `src/app/jobs/[jobName]/page.tsx` - Job details page
- `src/app/settings/page.tsx` - Connection settings
- `src/app/troubleshooting/page.tsx` - Issue troubleshooting

## Data Flow

1. User configures a Jenkins connection in Settings
2. Connection is encrypted and stored in localStorage
3. Active connection is used to initialize the Jenkins API client
4. React hooks query the API routes when components mount
5. API routes use the Jenkins client to fetch data from Jenkins servers
6. Fetched data is cached to minimize duplicate requests
7. UI components render the fetched data

## Key Improvements

- **Caching System**: `JenkinsApiClient` implements a caching layer in `getCachedOrFetch` method
- **Retry Mechanism**: `requestWithRetry` method handles temporary failures
- **Encryption**: Context provider uses `encryptData`/`decryptData` for credential protection
- **Parallel Processing**: Issue analysis uses `Promise.all` for concurrent job analysis
- **Data Masking**: Console output uses `maskSensitiveData` to protect sensitive information