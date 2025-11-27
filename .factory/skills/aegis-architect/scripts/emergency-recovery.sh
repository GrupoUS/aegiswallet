#!/bin/bash

# AegisWallet Emergency Recovery Script
# Provides comprehensive system diagnostics and recovery procedures
# For voice-first Brazilian fintech applications

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR=${PROJECT_DIR:-$(pwd)}
LOG_FILE="/tmp/aegiswallet_emergency_recovery_$(date +%Y%m%d_%H%M%S).log"
API_URL=${API_URL:-"http://localhost:3000"}
SUPABASE_URL=${SUPABASE_URL:-"https://your-project.supabase.co"}

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# Show help
show_help() {
    cat << EOF
AegisWallet Emergency Recovery Script v3.0

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -q, --quick             Run quick health checks only
    -f, --full              Run comprehensive diagnostics (default)
    -r, --recovery          Attempt automatic recovery
    -v, --verbose           Verbose output
    --api-url URL           API endpoint URL (default: http://localhost:3000)
    --log-file FILE         Custom log file location
    --check-voice           Include voice system diagnostics
    --check-brazilian       Include Brazilian compliance checks
    --backup-before         Create backup before recovery actions

EXAMPLES:
    $0                      # Run full diagnostics
    $0 -q                   # Quick health check
    $0 -r --backup-before   # Full recovery with backup

EMERGENCY RECOVERY STEPS:
    1. System Health Check
    2. Voice Interface Diagnostics
    3. Database Connectivity
    4. Brazilian Compliance Check
    5. Performance Analysis
    6. Security Validation
    7. Recovery Actions (if requested)

EOF
}

# Quick system health check
quick_health_check() {
    log "🏥 Starting Quick Health Check..."
    
    local issues=0
    
    # Check API connectivity
    log "📡 Checking API connectivity..."
    if curl -s --max-time 10 "$API_URL/health" > /dev/null 2>&1; then
        success "API is responsive"
    else
        error "API is not responding at $API_URL"
        ((issues++))
    fi
    
    # Check process status
    log "🔍 Checking running processes..."
    
    # Check for Node.js/Hono processes
    if pgrep -f "node.*hono" > /dev/null 2>&1 || pgrep -f "bun.*dev" > /dev/null 2>&1; then
        success "Backend process is running"
    else
        error "No backend process found"
        ((issues++))
    fi
    
    # Check for frontend dev server
    if pgrep -f "vite\|webpack.*dev" > /dev/null 2>&1; then
        success "Frontend dev server is running"
    else
        warning "Frontend dev server not found"
    fi
    
    # Check essential files
    log "📁 Checking essential project files..."
    local required_files=("package.json" "bun.lockb" "tsconfig.json" "vite.config.ts")
    for file in "${required_files[@]}"; do
        if [[ -f "$PROJECT_DIR/$file" ]]; then
            success "Found $file"
        else
            error "Missing $file"
            ((issues++))
        fi
    done
    
    # Check environment
    log "🔐 Checking environment configuration..."
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        success "Environment file found"
        
        # Check for critical env vars (without exposing values)
        local critical_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
        for var in "${critical_vars[@]}"; do
            if grep -q "^$var=" "$PROJECT_DIR/.env"; then
                success "Environment variable $var is set"
            else
                warning "Missing environment variable: $var"
                ((issues++))
            fi
        done
    else
        error "Environment file not found"
        ((issues++))
    fi
    
    log "🏥 Quick Health Check Complete - Issues found: $issues"
    return $issues
}

# Voice system diagnostics
check_voice_system() {
    log "🎤 Checking Voice Interface System..."
    
    local issues=0
    
    # Check for voice-related files and patterns
    log "🔍 Scanning for voice interface components..."
    
    local voice_files=(
        "src/hooks/useVoiceRecognition.ts"
        "src/lib/stt/"
        "src/lib/tts/"
        "src/components/voice/"
    )
    
    for file in "${voice_files[@]}"; do
        if [[ -f "$PROJECT_DIR/$file" ]] || [[ -d "$PROJECT_DIR/$file" ]]; then
            success "Voice component found: $file"
        else
            warning "Voice component missing: $file"
        fi
    done
    
    # Check browser permissions (if we're in a browser context)
    log "🎧 Checking audio permissions..."
    
    # Check for voice activity detection
    if grep -r "webkitSpeechRecognition\|SpeechRecognition" "$PROJECT_DIR/src" > /dev/null 2>&1; then
        success "Speech recognition implementation found"
    else
        warning "Speech recognition implementation not found"
        ((issues++))
    fi
    
    # Check for voice performance optimizations
    log "⚡ Checking voice performance optimizations..."
    local perf_patterns=(
        "VAD" "voice.*activity.*detection"
        "processing.*delay" "auto.*stop.*timeout"
        "silence.*duration"
    )
    
    for pattern in "${perf_patterns[@]}"; do
        if grep -r -i "$pattern" "$PROJECT_DIR/src" > /dev/null 2>&1; then
            success "Voice optimization found: $pattern"
        fi
    done
    
    log "🎤 Voice System Check Complete - Issues: $issues"
    return $issues
}

# Brazilian compliance check
check_brazilian_compliance() {
    log "🇧🇷 Checking Brazilian Compliance..."
    
    local issues=0
    
    # Check for LGPD compliance
    log "🔐 Checking LGPD compliance..."
    if grep -r -i "lgpd\|consentimento\|data.*protection" "$PROJECT_DIR/src" > /dev/null 2>&1; then
        success "LGPD compliance patterns found"
    else
        warning "LGPD compliance patterns not found"
        ((issues++))
    fi
    
    # Check for PIX implementation
    log "💰 Checking PIX implementation..."
    if grep -r -i "pix\|end.*to.*end.*id" "$PROJECT_DIR/src" > /dev/null 2>&1; then
        success "PIX implementation patterns found"
    else
        warning "PIX implementation patterns not found"
        ((issues++))
    fi
    
    # Check for Brazilian Portuguese localization
    log "🌍 Checking Brazilian Portuguese support..."
    if grep -r -i "pt.*br\|português\|brazilian" "$PROJECT_DIR/src" > /dev/null 2>&1; then
        success "Brazilian Portuguese support found"
    else
        warning "Brazilian Portuguese support not found"
        ((issues++))
    fi
    
    # Check for CPF/CNPJ validation
    if grep -r -i "cpf\|cnpj.*validation" "$PROJECT_DIR/src" > /dev/null 2>&1; then
        success "Brazilian document validation found"
    else
        warning "Brazilian document validation not found"
        ((issues++))
    fi
    
    log "🇧🇷 Brazilian Compliance Check Complete - Issues: $issues"
    return $issues
}

# Database connectivity check
check_database() {
    log "🗄️ Checking Database Connectivity..."
    
    local issues=0
    
    # Check Supabase configuration
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        if grep -q "SUPABASE_URL=" "$PROJECT_DIR/.env"; then
            success "Supabase URL configured"
            
            # Test Supabase connectivity (if curl is available)
            local supabase_url=$(grep "SUPABASE_URL=" "$PROJECT_DIR/.env" | cut -d'=' -f2)
            if [[ -n "$supabase_url" ]]; then
                log "🌐 Testing Supabase connectivity..."
                if curl -s --max-time 10 "$supabase_url/rest/v1/" > /dev/null 2>&1; then
                    success "Supabase is accessible"
                else
                    error "Cannot reach Supabase at $supabase_url"
                    ((issues++))
                fi
            fi
        else
            error "Supabase URL not configured"
            ((issues++))
        fi
    else
        error "No environment file found for database configuration"
        ((issues++))
    fi
    
    # Check for database migrations
    log "📋 Checking database migrations..."
    if [[ -d "$PROJECT_DIR/supabase/migrations" ]]; then
        local migration_count=$(find "$PROJECT_DIR/supabase/migrations" -name "*.sql" | wc -l)
        if [[ $migration_count -gt 0 ]]; then
            success "Found $migration_count database migrations"
        else
            warning "No database migrations found"
        fi
    else
        warning "Supabase migrations directory not found"
    fi
    
    log "🗄️ Database Check Complete - Issues: $issues"
    return $issues
}

# Performance analysis
check_performance() {
    log "⚡ Checking Performance..."
    
    local issues=0
    
    # Check bundle optimization
    log "📦 Checking bundle optimization..."
    if [[ -f "$PROJECT_DIR/vite.config.ts" ]]; then
        if grep -q "codeSplitting\|splitVendorChunkPlugin\|build.rollupOptions" "$PROJECT_DIR/vite.config.ts"; then
            success "Bundle optimization found in Vite config"
        else
            warning "Bundle optimization not configured"
            ((issues++))
        fi
    fi
    
    # Check for React performance optimizations
    log "⚛️ Checking React performance patterns..."
    local react_patterns=("useMemo" "useCallback" "React.lazy" "Suspense")
    for pattern in "${react_patterns[@]}"; do
        if grep -r "$pattern" "$PROJECT_DIR/src" > /dev/null 2>&1; then
            success "React optimization found: $pattern"
        fi
    done
    
    # Check for caching strategies
    log "💾 Checking caching strategies..."
    if grep -r -i "cache\|ttl\|stale.*while.*revalidate" "$PROJECT_DIR/src" > /dev/null 2>&1; then
        success "Caching strategies found"
    else
        warning "Caching strategies not found"
        ((issues++))
    fi
    
    log "⚡ Performance Check Complete - Issues: $issues"
    return $issues
}

# Security validation
check_security() {
    log "🔒 Checking Security..."
    
    local issues=0
    
    # Check for hardcoded secrets (basic pattern)
    log "🔍 Checking for security issues..."
    local secret_patterns=("api.*key.*=" "secret.*=" "password.*=" "supabase.*eyJ")
    for pattern in "${secret_patterns[@]}"; do
        if grep -r -i "$pattern" "$PROJECT_DIR/src" --exclude-dir=node_modules > /dev/null 2>&1; then
            error "Potential hardcoded secret found: $pattern"
            ((issues++))
        fi
    done
    
    # Check for HTTPS enforcement
    if [[ -f "$PROJECT_DIR/vite.config.ts" ]]; then
        if grep -q "https:" "$PROJECT_DIR/vite.config.ts"; then
            success "HTTPS configuration found"
        else
            warning "HTTPS enforcement not found in development config"
        fi
    fi
    
    # Check for authentication implementation
    if grep -r -i "auth\|authentication\|jwt" "$PROJECT_DIR/src" > /dev/null 2>&1; then
        success "Authentication implementation found"
    else
        warning "Authentication implementation not found"
        ((issues++))
    fi
    
    log "🔒 Security Check Complete - Issues: $issues"
    return $issues
}

# Recovery actions
perform_recovery() {
    log "🚀 Starting Recovery Actions..."
    
    local recovery_actions=0
    
    # Restart development server if needed
    if ! pgrep -f "bun.*dev\|npm.*dev\|yarn.*dev" > /dev/null 2>&1; then
        log "🔄 Attempting to start development server..."
        cd "$PROJECT_DIR"
        
        # Try to determine package manager
        if [[ -f "bun.lockb" ]]; then
            log "Using Bun package manager..."
            bun install --silent 2>/dev/null || warning "Bun install failed"
            bun run dev --silent > /dev/null 2>&1 &
            recovery_actions=$((recovery_actions + 1))
        elif [[ -f "package-lock.json" ]]; then
            log "Using npm package manager..."
            npm install --silent 2>/dev/null || warning "npm install failed"
            npm run dev --silent > /dev/null 2>&1 &
            recovery_actions=$((recovery_actions + 1))
        elif [[ -f "yarn.lock" ]]; then
            log "Using Yarn package manager..."
            yarn install --silent 2>/dev/null || warning "yarn install failed"
            yarn dev --silent > /dev/null 2>&1 &
            recovery_actions=$((recovery_actions + 1))
        fi
        
        sleep 5  # Give server time to start
        
        if pgrep -f "bun.*dev\|npm.*dev\|yarn.*dev" > /dev/null 2>&1; then
            success "Development server started successfully"
        else
            error "Failed to start development server"
        fi
    else
        success "Development server is already running"
    fi
    
    # Clear common caches
    log "🧹 Clearing caches..."
    
    # Clear Node.js cache if exists
    if [[ -d "$HOME/.npm" ]]; then
        npm cache clean --force > /dev/null 2>&1 || true
        success "npm cache cleared"
    fi
    
    # Clear Bun cache if exists
    if command -v bun > /dev/null 2>&1; then
        bun pm cache rm > /dev/null 2>&1 || true
        success "Bun cache cleared"
    fi
    
    # Check and clear common log files
    local log_dirs=("$PROJECT_DIR/logs" "$PROJECT_DIR/.next" "$PROJECT_DIR/dist")
    for dir in "${log_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            rm -rf "$dir"/* 2>/dev/null || true
            success "Cleared cache directory: $dir"
        fi
    done
    
    log "🚀 Recovery Actions Complete - Actions performed: $recovery_actions"
    return $recovery_actions
}

# Create backup before recovery
create_backup() {
    log "💾 Creating backup before recovery..."
    
    local backup_dir="$HOME/aegiswallet_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup critical files
    local backup_files=(
        ".env"
        "package.json"
        "tsconfig.json"
        "vite.config.ts"
        "src/"
        "supabase/"
    )
    
    for item in "${backup_files[@]}"; do
        if [[ -e "$PROJECT_DIR/$item" ]]; then
            cp -r "$PROJECT_DIR/$item" "$backup_dir/" 2>/dev/null || warning "Failed to backup $item"
        fi
    done
    
    success "Backup created at: $backup_dir"
    echo "$backup_dir" > /tmp/last_aegiswallet_backup
}

# Generate comprehensive report
generate_report() {
    log "📊 Generating Emergency Recovery Report..."
    
    local report_file="/tmp/aegiswallet_recovery_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
AEGISWALLET EMERGENCY RECOVERY REPORT
=====================================
Date: $(date)
Project: $PROJECT_DIR
Log File: $LOG_FILE

SYSTEM STATUS
------------
- API Status: $(curl -s --max-time 5 -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "FAILED")
- Backend Process: $(pgrep -f "node.*hono\|bun.*dev" > /dev/null 2>&1 && echo "RUNNING" || echo "STOPPED")
- Frontend Process: $(pgrep -f "vite\|webpack.*dev" > /dev/null 2>&1 && echo "RUNNING" || echo "STOPPED")

DIAGNOSTIC RESULTS
------------------
$(cat "$LOG_FILE" | grep -E "\[(SUCCESS|WARNING|ERROR)\]" | tail -20)

RECOMMENDATIONS
---------------
1. Ensure all environment variables are properly configured
2. Check voice interface permissions in browser settings
3. Verify Brazilian compliance patterns are implemented
4. Monitor performance for voice response times (<200ms target)
5. Regular backup of critical configuration files

NEXT STEPS
----------
- Address any critical issues found during diagnostics
- Implement missing compliance patterns
- Optimize performance for voice interactions
- Set up monitoring for production deployment

EOF
    
    success "Recovery report generated: $report_file"
    cat "$report_file"
}

# Main execution
main() {
    local quick_check=false
    local full_check=true
    local perform_recovery_actions=false
    local verbose=false
    local check_voice=false
    local check_brazilian=false
    local backup_before=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -q|--quick)
                quick_check=true
                full_check=false
                shift
                ;;
            -f|--full)
                full_check=true
                shift
                ;;
            -r|--recovery)
                perform_recovery_actions=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                set -x
                shift
                ;;
            --check-voice)
                check_voice=true
                shift
                ;;
            --check-brazilian)
                check_brazilian=true
                shift
                ;;
            --backup-before)
                backup_before=true
                shift
                ;;
            --api-url)
                API_URL="$2"
                shift 2
                ;;
            --log-file)
                LOG_FILE="$2"
                shift 2
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log "🚀 Starting AegisWallet Emergency Recovery..."
    log "📁 Project Directory: $PROJECT_DIR"
    log "📋 Log File: $LOG_FILE"
    
    # Create backup if requested
    if [[ "$backup_before" == true ]]; then
        create_backup
    fi
    
    local total_issues=0
    
    # Run diagnostics
    if [[ "$quick_check" == true ]]; then
        quick_health_check
        total_issues=$((total_issues + $?))
    else
        # Full diagnostic suite
        quick_health_check
        total_issues=$((total_issues + $?))
        
        check_database
        total_issues=$((total_issues + $?))
        
        if [[ "$check_voice" == true ]]; then
            check_voice_system
            total_issues=$((total_issues + $?))
        fi
        
        if [[ "$check_brazilian" == true ]]; then
            check_brazilian_compliance
            total_issues=$((total_issues + $?))
        fi
        
        check_performance
        total_issues=$((total_issues + $?))
        
        check_security
        total_issues=$((total_issues + $?))
    fi
    
    # Perform recovery if requested
    if [[ "$perform_recovery_actions" == true ]]; then
        perform_recovery
    fi
    
    # Generate final report
    generate_report
    
    # Final status
    log "🏁 Emergency Recovery Complete"
    log "📊 Total Issues Found: $total_issues"
    
    if [[ $total_issues -eq 0 ]]; then
        success "✅ No critical issues found - System appears healthy"
        exit 0
    elif [[ $total_issues -le 3 ]]; then
        warning "⚠️ Minor issues found - System should be functional"
        exit 0
    else
        error "❌ Multiple issues found - System may need attention"
        exit 1
    fi
}

# Execute main function with all arguments
main "$@"
