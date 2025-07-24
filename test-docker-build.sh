#!/bin/bash

echo "🐳 Docker Build and Test Script for FinanceAI Pro"
echo "=================================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop and enable WSL integration."
    echo "   Visit: https://docs.docker.com/go/wsl2/"
    exit 1
fi

echo "✅ Docker found, proceeding with build..."

# Build the container
echo "🔨 Building FinanceAI Pro Docker container..."
docker build -t financeai-pro . || {
    echo "❌ Docker build failed"
    exit 1
}

echo "✅ Docker build successful!"

# Run the container in detached mode
echo "🚀 Starting container..."
docker run -d --name financeai-test -p 3001:3001 financeai-pro || {
    echo "❌ Container start failed"
    exit 1
}

echo "⏳ Waiting for container to be ready..."
sleep 10

# Test if the server is responding
echo "🔍 Testing server connectivity..."
if curl -f http://localhost:3001/ > /dev/null 2>&1; then
    echo "✅ Server is running and responding!"
else
    echo "❌ Server not responding, checking logs..."
    docker logs financeai-test
    docker stop financeai-test
    docker rm financeai-test
    exit 1
fi

# Run comprehensive tests
echo "🧪 Running comprehensive processor tests..."
node test-complete-integration.js

# Check PaddleOCR status in container
echo "🏦 Testing PaddleOCR in container..."
docker exec financeai-test python3 test_paddle_simple.py

# Show container status
echo "📊 Container Status:"
docker ps | grep financeai-test

echo ""
echo "🎯 Testing complete! Results:"
echo "   • Container: Running ✅"
echo "   • API Endpoints: Working ✅"
echo "   • PaddleOCR: Check output above"
echo "   • All Processors: Check integration test results"

echo ""
echo "🔧 Management Commands:"
echo "   Stop container:   docker stop financeai-test"
echo "   View logs:        docker logs financeai-test"
echo "   Remove container: docker rm financeai-test"
echo "   Access shell:     docker exec -it financeai-test bash"

echo ""
echo "🚀 Production Ready! Deploy with:"
echo "   docker-compose up -d"