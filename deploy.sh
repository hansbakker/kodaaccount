#!/bin/zsh

# KodaAccount Deployment & Update Script for Mac
# Usage: ./deploy.sh [github_url]

REPO_URL=$1
TARGET_DIR="KodaAccount"

echo "🚀 Starting KodaAccount Deployment/Update..."

# 1. Check for Git
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# 2. Check for Node/NPM
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/NPM is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# 3. Clone or Pull
if [ -d "$TARGET_DIR" ]; then
    echo "Update existing installation..."
    cd "$TARGET_DIR"
    git pull
else
    if [ -z "$REPO_URL" ]; then
        echo "❌ Directory $TARGET_DIR not found. Please provide the GitHub URL: ./deploy.sh https://github.com/user/KodaAccount.git"
        exit 1
    fi
    echo "Cloning new repository..."
    git clone "$REPO_URL" "$TARGET_DIR"
    cd "$TARGET_DIR"
fi

# 4. Install Dependencies
echo "📦 Installing dependencies..."
npm install

# 5. Build for Production
echo "🏗️ Building application..."
npm run build

# 6. Finish
echo ""
echo "✅ KodaAccount is ready!"
echo "------------------------------------------------"
echo "To start the development server:"
echo "  cd $TARGET_DIR && npm run dev"
echo ""
echo "To view the production build (static files):"
echo "  Open $TARGET_DIR/dist/index.html in your browser"
echo "  (Note: some browsers require a local server to run builds)"
echo "------------------------------------------------"
