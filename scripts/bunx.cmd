@echo off
REM bunx wrapper for Windows - redirects to bun x command
if "%1"=="" (
    echo Usage: bunx [flags] [package] [args...]
    echo Example: bunx vitest --version
    exit /b 1
)
bun x %*
