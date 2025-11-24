#!/usr/bin/env pwsh

# Script para iniciar o servidor de desenvolvimento com variáveis de ambiente

# Definir variáveis de ambiente
$env:VITE_SUPABASE_URL="https://qatxdwderitvxqvuonqs.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdHhkd2Rlcml0dnhxdnVvbnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODc4NjgsImV4cCI6MjA3ODM2Mzg2OH0.qyuqqKwLpXSK23iMDEzn2uOdkQvHhSFkEAVwMrYwiSI"
$env:SUPABASE_URL=$env:VITE_SUPABASE_URL
$env:SUPABASE_ANON_KEY=$env:VITE_SUPABASE_ANON_KEY
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdHhkd2Rlcml0dnhxdnVvbnFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDEwNzg3MCwiZXhwIjoyMDQ5NjgzODcwfQ.pBfkSsN_x5-t9y2GlOVKKbG8GjvlHNfKjvvXNPZvyUQ"
$env:SUPABASE_QA_USER_ID="test-user-id"

# Iniciar o servidor de desenvolvimento
Write-Host "Iniciando servidor de desenvolvimento com variáveis de ambiente configuradas..."
bun run dev
