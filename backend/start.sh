#!/bin/bash
# Startup script for Flowstate backend with proper LSL library path

# Set DYLD_LIBRARY_PATH for macOS to find LSL library
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"

# Run the backend
python3 main.py

