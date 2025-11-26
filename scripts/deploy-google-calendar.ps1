# Google Calendar Integration - Complete Deployment Script
# Prerequisites:
# 1. Supabase CLI logged in: bunx supabase login
# 2. Google OAuth credentials set as environment variables:
#    $env:GOOGLE_CLIENT_ID = "your-client-id"
#    $env:GOOGLE_CLIENT_SECRET = "your-client-secret"

param(
    [switch]$SecretsOnly,
    [switch]$FunctionsOnly,
    [switch]$All
)

$PROJECT_REF = "qatxdwderitvxqvuonqs"

function Set-Secrets {
    Write-Host "`n=== Setting Supabase Secrets ===" -ForegroundColor Cyan

    # Generated secrets
    $TOKENS_ENCRYPTION_KEY = "e5441bdac357d141aeb7945c78a4636db95a9003377f1c4b71c7c51d8fe81394"
    $WEBHOOK_SECRET = "cdf2165bcd38140afc78fab7697a29c1"

    if (-not $env:GOOGLE_CLIENT_ID -or -not $env:GOOGLE_CLIENT_SECRET) {
        Write-Host "ERROR: Google OAuth credentials not found!" -ForegroundColor Red
        Write-Host 'Set: $env:GOOGLE_CLIENT_ID = "your-id"' -ForegroundColor Yellow
        Write-Host 'Set: $env:GOOGLE_CLIENT_SECRET = "your-secret"' -ForegroundColor Yellow
        return $false
    }

    Write-Host "Setting TOKENS_ENCRYPTION_KEY..." -ForegroundColor Green
    bunx supabase secrets set TOKENS_ENCRYPTION_KEY=$TOKENS_ENCRYPTION_KEY --project-ref $PROJECT_REF

    Write-Host "Setting WEBHOOK_SECRET..." -ForegroundColor Green
    bunx supabase secrets set WEBHOOK_SECRET=$WEBHOOK_SECRET --project-ref $PROJECT_REF

    Write-Host "Setting GOOGLE_CLIENT_ID..." -ForegroundColor Green
    bunx supabase secrets set GOOGLE_CLIENT_ID=$env:GOOGLE_CLIENT_ID --project-ref $PROJECT_REF

    Write-Host "Setting GOOGLE_CLIENT_SECRET..." -ForegroundColor Green
    bunx supabase secrets set GOOGLE_CLIENT_SECRET=$env:GOOGLE_CLIENT_SECRET --project-ref $PROJECT_REF

    Write-Host "Setting GOOGLE_REDIRECT_URI..." -ForegroundColor Green
    $REDIRECT_URI = "https://$PROJECT_REF.supabase.co/functions/v1/google-calendar-auth?action=callback"
    bunx supabase secrets set GOOGLE_REDIRECT_URI=$REDIRECT_URI --project-ref $PROJECT_REF

    Write-Host "Secrets configured successfully!" -ForegroundColor Green
    return $true
}

function Deploy-Functions {
    Write-Host "`n=== Deploying Edge Functions ===" -ForegroundColor Cyan

    $functions = @(
        "google-calendar-auth",
        "google-calendar-sync",
        "google-calendar-webhook"
    )

    foreach ($func in $functions) {
        Write-Host "Deploying $func..." -ForegroundColor Yellow
        bunx supabase functions deploy $func --project-ref $PROJECT_REF
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to deploy $func" -ForegroundColor Red
            return $false
        }
        Write-Host "Deployed $func successfully!" -ForegroundColor Green
    }

    return $true
}

function Show-NextSteps {
    Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Cyan
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "1. Configure Google Cloud Console:" -ForegroundColor White
    Write-Host "   - Add authorized redirect URI:" -ForegroundColor Gray
    Write-Host "   https://$PROJECT_REF.supabase.co/functions/v1/google-calendar-auth?action=callback" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Test the integration:" -ForegroundColor White
    Write-Host "   - Navigate to Calendar Settings in AegisWallet" -ForegroundColor Gray
    Write-Host "   - Click 'Connect Google Calendar'" -ForegroundColor Gray
    Write-Host "   - Complete OAuth flow" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Verify webhook registration in logs:" -ForegroundColor White
    Write-Host "   bunx supabase functions logs google-calendar-auth --project-ref $PROJECT_REF" -ForegroundColor Cyan
}

# Main execution
Write-Host "Google Calendar Integration Deployment" -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta

if ($SecretsOnly) {
    Set-Secrets
} elseif ($FunctionsOnly) {
    Deploy-Functions
} else {
    # Default: run everything
    $secretsOk = Set-Secrets
    if ($secretsOk) {
        $functionsOk = Deploy-Functions
        if ($functionsOk) {
            Show-NextSteps
        }
    }
}

