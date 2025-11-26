# Google Calendar Integration - Supabase Secrets Setup Script
# Run this script after logging into Supabase CLI: bunx supabase login

Write-Host "Setting up Google Calendar integration secrets..." -ForegroundColor Cyan

# Generated secrets (you can regenerate these if needed)
$TOKENS_ENCRYPTION_KEY = "e5441bdac357d141aeb7945c78a4636db95a9003377f1c4b71c7c51d8fe81394"
$WEBHOOK_SECRET = "cdf2165bcd38140afc78fab7697a29c1"

# IMPORTANT: Replace these with your actual Google OAuth credentials
$GOOGLE_CLIENT_ID = $env:GOOGLE_CLIENT_ID
$GOOGLE_CLIENT_SECRET = $env:GOOGLE_CLIENT_SECRET

if (-not $GOOGLE_CLIENT_ID -or -not $GOOGLE_CLIENT_SECRET) {
    Write-Host ""
    Write-Host "ERROR: Google OAuth credentials not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set environment variables before running this script:" -ForegroundColor Yellow
    Write-Host '  $env:GOOGLE_CLIENT_ID = "your-client-id"'
    Write-Host '  $env:GOOGLE_CLIENT_SECRET = "your-client-secret"'
    Write-Host ""
    Write-Host "Or edit this script directly with your credentials."
    exit 1
}

Write-Host "Setting TOKENS_ENCRYPTION_KEY..." -ForegroundColor Green
bunx supabase secrets set TOKENS_ENCRYPTION_KEY=$TOKENS_ENCRYPTION_KEY --project-ref qatxdwderitvxqvuonqs

Write-Host "Setting WEBHOOK_SECRET..." -ForegroundColor Green
bunx supabase secrets set WEBHOOK_SECRET=$WEBHOOK_SECRET --project-ref qatxdwderitvxqvuonqs

Write-Host "Setting GOOGLE_CLIENT_ID..." -ForegroundColor Green
bunx supabase secrets set GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID --project-ref qatxdwderitvxqvuonqs

Write-Host "Setting GOOGLE_CLIENT_SECRET..." -ForegroundColor Green
bunx supabase secrets set GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET --project-ref qatxdwderitvxqvuonqs

Write-Host "Setting GOOGLE_REDIRECT_URI..." -ForegroundColor Green
bunx supabase secrets set GOOGLE_REDIRECT_URI="https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth?action=callback" --project-ref qatxdwderitvxqvuonqs

Write-Host ""
Write-Host "Secrets setup complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy edge functions: bunx supabase functions deploy google-calendar-auth --project-ref qatxdwderitvxqvuonqs"
Write-Host "2. Deploy: bunx supabase functions deploy google-calendar-sync --project-ref qatxdwderitvxqvuonqs"
Write-Host "3. Deploy: bunx supabase functions deploy google-calendar-webhook --project-ref qatxdwderitvxqvuonqs"

