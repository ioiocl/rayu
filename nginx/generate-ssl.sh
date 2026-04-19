#!/bin/bash

# Script para generar certificados SSL autofirmados para desarrollo

mkdir -p ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✅ Certificados SSL generados en nginx/ssl/"
echo "   - cert.pem"
echo "   - key.pem"
