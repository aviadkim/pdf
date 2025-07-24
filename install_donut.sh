#!/bin/bash
# DONUT Installation Script

echo "Installing DONUT dependencies..."

# Install PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install transformers with specific version
pip install transformers>=4.21.0

# Install required dependencies
pip install sentencepiece protobuf timm opencv-python datasets

# Install DONUT specific requirements
pip install donut-python

echo "DONUT installation complete!"
echo "Test with: python working_donut.py"
