#!/usr/bin/env bash
# MTAA Health - Build a Docker image for the web export
if ! command -v docker >/dev/null 2>&1; then echo "⚠️  docker not installed"; exit 0; fi
npx expo export --platform web
cat > Dockerfile.mtaa-health << 'EOF'
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
EOF
docker build -f Dockerfile.mtaa-health -t mtaa-health:latest . \
  && echo "✅ image built: mtaa-health:latest  (run: docker run -p 8080:80 mtaa-health)"
