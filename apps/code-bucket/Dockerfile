# Multi-stage build for Code Bucket service with embedded VSCode workspace

# Stage 1: Build VSCode workspace
FROM oven/bun:1.2-alpine AS workspace-builder

WORKDIR /workspace

# Copy workspace package files
COPY code-workspace/package.json ./
RUN bun install

# Copy all workspace files
COPY code-workspace/ ./

# Create necessary directories and copy vscode-web files
RUN mkdir -p ./public/vscode && \
    mkdir -p ./public/extensions/memfs && \
    cp -r node_modules/vscode-web/dist/* ./public/vscode/ && \
    mkdir -p ./public/vscode/vscode-textmate/release && \
    cp node_modules/vscode-textmate/release/main.js ./public/vscode/vscode-textmate/release/ && \
    mkdir -p ./public/vscode/vscode-oniguruma/release && \
    cp node_modules/vscode-oniguruma/release/main.js ./public/vscode/vscode-oniguruma/release/ && \
    cp node_modules/vscode-oniguruma/release/onig.wasm ./public/vscode/vscode-oniguruma/release/

# Build memfs extension
RUN cd extensions/memfs && \
    bun install && \
    bun run package && \
    cd ../.. && \
    cp -r extensions/memfs/dist/* ./public/extensions/memfs/ && \
    cp extensions/memfs/package.json ./public/extensions/memfs/package.json && \
    cp extensions/memfs/package.nls.json ./public/extensions/memfs/package.nls.json

# Build the workspace
RUN bun x tsc && bun x vite build

# Stage 2: Build Go service
FROM golang:1.24-alpine AS go-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Copy go mod files
COPY code-bucket/go.mod code-bucket/go.sum ./
RUN go mod download

# Copy source code
COPY code-bucket/ ./

# Copy built workspace from previous stage
COPY --from=workspace-builder /workspace/dist ./pkg/workspace/dist

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o code-bucket ./cmd/server

# Stage 3: Final minimal image
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary from builder
COPY --from=go-builder /app/code-bucket .

# Expose ports
# 52091: HTTP API
# 52092: VSCode Workspace
# 5050: gRPC
EXPOSE 52091 52092 5050

# Run the service
CMD ["./code-bucket"]
