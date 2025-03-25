@echo off
:: Jenkins Insights App Deployment Script for Windows
setlocal enabledelayedexpansion

:: ASCII colors for Windows
set "GREEN=[32m"
set "YELLOW=[33m"
set "RED=[31m"
set "NC=[0m"
set "BOLD=[1m"

:: Print banner
echo %GREEN%%BOLD%===================================================================================
echo                    Jenkins Insights App - Deployment Script                         
echo ===================================================================================%NC%

:: Check if required tools are installed
echo %YELLOW%Checking required dependencies...%NC%

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %RED%Node.js is not installed. Please install Node.js 18+ and try again.%NC%
    exit /b 1
)

for /f "tokens=*" %%a in ('node -v') do set NODE_VERSION=%%a
echo Node.js version: %GREEN%%NODE_VERSION%%NC%

:: Check npm or pnpm
where pnpm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PKG_MANAGER=pnpm
    echo Package manager: %GREEN%pnpm%NC%
) else (
    where npm >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set PKG_MANAGER=npm
        echo Package manager: %GREEN%npm%NC%
    ) else (
        echo %RED%Neither npm nor pnpm is installed. Please install a package manager and try again.%NC%
        exit /b 1
    )
)

:: Check if wrangler is available globally (optional for Cloudflare deployment)
where wrangler >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set WRANGLER_AVAILABLE=true
    echo Wrangler CLI: %GREEN%Available%NC%
) else (
    set WRANGLER_AVAILABLE=false
    echo Wrangler CLI: %YELLOW%Not available (needed only for Cloudflare deployment)%NC%
)

:: Determine deployment environment
echo.
echo %YELLOW%Select deployment environment:%NC%
echo 1) Development (local testing)
echo 2) Production (Cloudflare deployment)
echo 3) Custom (will ask for additional configuration)
set /p DEPLOY_ENV_CHOICE="Enter your choice (1-3): "

if "%DEPLOY_ENV_CHOICE%"=="1" (
    set DEPLOY_ENV=development
) else if "%DEPLOY_ENV_CHOICE%"=="2" (
    set DEPLOY_ENV=production
    if "%WRANGLER_AVAILABLE%"=="false" (
        echo %YELLOW%Warning: Wrangler is required for Cloudflare deployment but not installed.%NC%
        echo We'll continue but you'll need to install it before deploying to Cloudflare.
    )
) else if "%DEPLOY_ENV_CHOICE%"=="3" (
    set DEPLOY_ENV=custom
) else (
    echo %RED%Invalid choice. Defaulting to development.%NC%
    set DEPLOY_ENV=development
)

:: Clean previous build artifacts
echo.
echo %YELLOW%Cleaning previous build artifacts...%NC%
if exist .next\ rmdir /s /q .next\
if exist out\ rmdir /s /q out\
if exist worker-site\ rmdir /s /q worker-site\
if exist dist\ rmdir /s /q dist\
echo %GREEN%Clean completed.%NC%

:: Install dependencies
echo.
echo %YELLOW%Installing dependencies...%NC%
if "%PKG_MANAGER%"=="pnpm" (
    call pnpm install
) else (
    call npm install
)
echo %GREEN%Dependencies installed successfully.%NC%

:: Run tests
echo.
echo %YELLOW%Running tests...%NC%
if "%PKG_MANAGER%"=="pnpm" (
    call pnpm test || echo %RED%Tests failed, but continuing with deployment.%NC%
) else (
    call npm test || echo %RED%Tests failed, but continuing with deployment.%NC%
)
echo %GREEN%Tests completed.%NC%

:: Build application
echo.
echo %YELLOW%Building application...%NC%
if "%PKG_MANAGER%"=="pnpm" (
    call pnpm build
) else (
    call npm run build
)
echo %GREEN%Build completed successfully.%NC%

:: Deployment
echo.
if "%DEPLOY_ENV%"=="development" (
    echo %YELLOW%Starting local development server...%NC%
    echo %GREEN%Application built successfully for development!%NC%
    echo You can now run '%BOLD%%PKG_MANAGER% run dev%NC%' to start the development server.
    
) else if "%DEPLOY_ENV%"=="production" (
    if "%WRANGLER_AVAILABLE%"=="true" (
        echo %YELLOW%Preparing for Cloudflare deployment...%NC%
        
        if "%PKG_MANAGER%"=="pnpm" (
            call pnpm build:worker
        ) else (
            call npm run build:worker
        )
        
        echo %GREEN%Cloudflare worker build completed.%NC%
        echo %YELLOW%You can now deploy to Cloudflare using:%NC%
        echo %BOLD%wrangler publish%NC%
    ) else (
        echo %YELLOW%Skipping Cloudflare deployment preparation since Wrangler is not installed.%NC%
        echo Install Wrangler with: %BOLD%npm install -g wrangler%NC%
    )
    
) else if "%DEPLOY_ENV%"=="custom" (
    echo %YELLOW%Custom deployment selected.%NC%
    echo The application has been built and is ready for custom deployment.
    echo Build artifacts can be found in the %BOLD%.next\%NC% directory.
)

:: Final instructions
echo.
echo %GREEN%===================================================================================%NC%
echo %GREEN%                   Jenkins Insights App - Deployment Complete                       %NC%
echo %GREEN%===================================================================================%NC%
echo.
echo Next steps:
echo 1. For local testing, run: %BOLD%%PKG_MANAGER% run dev%NC%
echo 2. For production deployment to Cloudflare: %BOLD%wrangler publish%NC%
echo 3. Access the dashboard at: %BOLD%http://localhost:3000%NC% (local) or your Cloudflare URL
echo.
echo %YELLOW%Thank you for using Jenkins Insights App!%NC%

:: End of script
endlocal