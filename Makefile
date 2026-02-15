.PHONY: help install build serve clean

# Default target
help:
	@echo "Available targets:"
	@echo "  make install          - Install dependencies (Jekyll gems and Python packages)"
	@echo "  make build            - Build the Jekyll site"
	@echo "  make serve [PORT=XXXX] - Serve the Jekyll site locally (default port 4000)"
	@echo "  make clean            - Clean generated files"

# Install dependencies
install:
	@echo "Installing Jekyll dependencies..."
	bundle install
	@echo "Installing Python dependencies..."
	pip install -q Pillow numpy || pip3 install -q Pillow numpy

# Build the Jekyll site
build:
	@echo "Building Jekyll site..."
	bundle exec jekyll build

# Serve the Jekyll site locally
# Usage: make serve [PORT=4001]
PORT ?= 4000
serve:
	@echo "Starting Jekyll server at http://localhost:$(PORT)"
	bundle exec jekyll serve --port $(PORT)

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	rm -rf _site
	@echo "Clean complete!"
