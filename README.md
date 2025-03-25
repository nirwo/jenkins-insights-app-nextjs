# Jenkins Insights App (Next.js)

A modern web application for Jenkins CI/CD monitoring and troubleshooting.

## Features

- Dashboard with system health stats and recent builds
- Job listing and filtering
- Build details and console output analysis
- Issue detection and troubleshooting
- URL-based job troubleshooting
- Multiple Jenkins server connections
- Secure credential storage

## Key Improvements

### UI Framework
- **Bootstrap 5**: Modern UI components with responsive design
- **Collapsible Sidebar**: Space-efficient navigation interface
- **Mobile-First Design**: Optimized experience across all devices
- **Dark Theme**: Improved readability for long troubleshooting sessions

### Performance Enhancements
- **Caching System**: Implemented a caching layer to reduce redundant API calls
- **Parallel Processing**: Issue analysis now processes jobs in parallel
- **Optimized Console Parsing**: Two-stage approach for faster log analysis
- **Framework Optimization**: Reduced bundle size with lean CSS approach

### Security Enhancements
- **Credential Protection**: Sensitive data is encrypted before storage
- **Masking System**: Credentials are automatically masked in logs
- **Input Validation**: Improved validation for user inputs
- **Access Controls**: Proper separation of client/server components

### Reliability Improvements
- **Request Retry**: Automatic retry mechanism for API failures
- **Timeout Handling**: Configurable timeouts to prevent hanging requests
- **Type Safety**: Improved TypeScript typing throughout the codebase
- **Framework Compatibility**: Enhanced support for React 19

### Error Handling
- **Consistent Error Patterns**: Standardized error handling across the app
- **User-friendly Messages**: Better error messages for troubleshooting
- **Graceful Degradation**: Components handle error states gracefully
- **Enhanced Troubleshooting**: URL-based analysis for quick diagnosis

## Deployment Options

### Automated Deployment (Recommended)

Use our deployment scripts for a guided setup process:

#### Windows
```
deploy.bat
```

#### macOS/Linux
```
chmod +x deploy.sh
./deploy.sh
```

The scripts will:
1. Check for required dependencies (Node.js, package manager)
2. Guide you through selecting a deployment environment
3. Clean previous builds and install dependencies
4. Run tests to verify everything works
5. Build the application for your target environment
6. Provide next steps based on your chosen deployment type

### Manual Deployment

#### 1. Install Dependencies

```bash
# Using npm
npm install

# Using pnpm
pnpm install
```

#### 2. Run Tests (Optional but Recommended)

```bash
# Using npm
npm test

# Using pnpm
pnpm test
```

#### 3. Local Development

```bash
# Using npm
npm run dev

# Using pnpm
pnpm dev
```

#### 4. Production Build

```bash
# Using npm
npm run build

# Using pnpm
pnpm build
```

#### 5. Cloudflare Deployment

```bash
# Using npm
npm run build:worker
npx wrangler publish

# Using pnpm
pnpm build:worker
pnpm exec wrangler publish
```

## Usage

### First-time Setup

1. Open the application in your browser
2. Go to the Settings page
3. Add a Jenkins connection with your server details
4. Test the connection to verify it works
5. Navigate to the Dashboard to start monitoring

### Key Features

- **Dashboard**: View system health metrics and recent build statuses
- **Jobs Page**: List, filter, and search all Jenkins jobs
- **Job Details**: View build history, console output, and test results
- **Troubleshooting**: Automatically detect and analyze issues
- **URL Troubleshooting**: Paste a Jenkins build URL to quickly analyze issues

## Testing

Run the test suite to verify all components:

```bash
npm test
# or
pnpm test
```

Run a manual test of key functionality:

```bash
node tests/manual-test.js
```

## Technologies

- Next.js 15
- React 19
- TypeScript
- Axios
- Bootstrap 5 (UI framework)
- Jest (testing)

## Requirements

- Node.js 18 or newer
- npm or pnpm package manager
- Wrangler CLI (for Cloudflare deployment)

## License

[MIT](https://choosealicense.com/licenses/mit/)
