#!/bin/bash
# Jenkins Insights App Deployment Script for Unix-based systems

set -e  # Exit immediately if a command exits with a non-zero status

# Setup terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Print banner
echo -e "${BOLD}${GREEN}"
echo "==================================================================================="
echo "                   Jenkins Insights App - Deployment Script                         "
echo "==================================================================================="
echo -e "${NC}"

# Check if required tools are installed
echo -e "${YELLOW}Checking required dependencies...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "Node.js version: ${GREEN}$NODE_VERSION${NC}"

# Check npm or pnpm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    echo -e "Package manager: ${GREEN}pnpm${NC}"
else
    if command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
        echo -e "Package manager: ${GREEN}npm${NC}"
    else
        echo -e "${RED}Neither npm nor pnpm is installed. Please install a package manager and try again.${NC}"
        exit 1
    fi
fi

# Check if wrangler is available globally (optional for Cloudflare deployment)
if command -v wrangler &> /dev/null; then
    WRANGLER_AVAILABLE=true
    echo -e "Wrangler CLI: ${GREEN}Available${NC}"
else
    WRANGLER_AVAILABLE=false
    echo -e "Wrangler CLI: ${YELLOW}Not available (needed only for Cloudflare deployment)${NC}"
fi

# Determine deployment environment
echo ""
echo -e "${YELLOW}Select deployment environment:${NC}"
echo "1) Development (local testing)"
echo "2) Production (Cloudflare deployment)"
echo "3) Custom (will ask for additional configuration)"
read -p "Enter your choice (1-3): " DEPLOY_ENV_CHOICE

case $DEPLOY_ENV_CHOICE in
    1)
        DEPLOY_ENV="development"
        ;;
    2)
        DEPLOY_ENV="production"
        if [ "$WRANGLER_AVAILABLE" = false ]; then
            echo -e "${YELLOW}Warning: Wrangler is required for Cloudflare deployment but not installed.${NC}"
            echo "We'll continue but you'll need to install it before deploying to Cloudflare."
        fi
        ;;
    3)
        DEPLOY_ENV="custom"
        ;;
    *)
        echo -e "${RED}Invalid choice. Defaulting to development.${NC}"
        DEPLOY_ENV="development"
        ;;
esac

# Clean previous build artifacts
echo ""
echo -e "${YELLOW}Cleaning previous build artifacts...${NC}"
rm -rf .next/ out/ worker-site/ dist/ || true
echo -e "${GREEN}Clean completed.${NC}"

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm install
else
    npm install
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}"

# Run tests
echo ""
echo -e "${YELLOW}Running tests...${NC}"
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm test || { echo -e "${RED}Tests failed, but continuing with deployment.${NC}"; }
else
    npm test || { echo -e "${RED}Tests failed, but continuing with deployment.${NC}"; }
fi
echo -e "${GREEN}Tests completed.${NC}"

# Build application
echo ""
echo -e "${YELLOW}Building application...${NC}"
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm build
else
    npm run build
fi
echo -e "${GREEN}Build completed successfully.${NC}"

# Deployment
echo ""
if [ "$DEPLOY_ENV" = "development" ]; then
    echo -e "${YELLOW}Starting local development server...${NC}"
    echo -e "${GREEN}Application built successfully for development!${NC}"
    echo -e "You can now run '${BOLD}${PKG_MANAGER} run dev${NC}' to start the development server."
    
elif [ "$DEPLOY_ENV" = "production" ]; then
    if [ "$WRANGLER_AVAILABLE" = true ]; then
        echo -e "${YELLOW}Preparing for Cloudflare deployment...${NC}"
        
        if [ "$PKG_MANAGER" = "pnpm" ]; then
            pnpm build:worker
        else
            npm run build:worker
        fi
        
        echo -e "${GREEN}Cloudflare worker build completed.${NC}"
        echo -e "${YELLOW}You can now deploy to Cloudflare using:${NC}"
        echo -e "${BOLD}wrangler publish${NC}"
    else
        echo -e "${YELLOW}Skipping Cloudflare deployment preparation since Wrangler is not installed.${NC}"
        echo -e "Install Wrangler with: ${BOLD}npm install -g wrangler${NC}"
    fi
    
elif [ "$DEPLOY_ENV" = "custom" ]; then
    echo -e "${YELLOW}Custom deployment selected.${NC}"
    echo -e "The application has been built and is ready for custom deployment."
    echo -e "Build artifacts can be found in the ${BOLD}.next/${NC} directory."
fi

# Final instructions
echo ""
echo -e "${GREEN}===================================================================================${NC}"
echo -e "${GREEN}                   Jenkins Insights App - Deployment Complete                       ${NC}"
echo -e "${GREEN}===================================================================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. For local testing, run: ${BOLD}${PKG_MANAGER} run dev${NC}"
echo -e "2. For production deployment to Cloudflare: ${BOLD}wrangler publish${NC}"
echo -e "3. Access the dashboard at: ${BOLD}http://localhost:3000${NC} (local) or your Cloudflare URL"
echo ""
echo -e "${YELLOW}Thank you for using Jenkins Insights App!${NC}"