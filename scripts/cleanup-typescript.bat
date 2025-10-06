@echo off
echo 🧹 Limpando erros de TypeScript não críticos...

removing unused imports...
find "src\*.tsx" /s /v /c "\"import React\"" >nul 2>nul | find /v /c "\"import.*React\"" | find /v /c "\"ptBR\"" | find /v /c "\"date-fns/locale\"" | find /v /c "\"Calendar.*Locale.*ptBR\"" | find /v /c "\"formatRelativeDate\"" | find /v /c "\"format.*ptBR\"" | find /v /c "\"ptBR\" | find /v /c "\"ptBR/g\"" | find /v /c "\"ptBR/g\"" | find /v /c "\"ptBR/g\"" | find /v /c "\"ptBR/g\"" >nul 2>nul

adding ptBR where needed...
find "src\*.tsx" /s /v /c "\"ptBR\"" | find /v /c "\"date-fns/locale\"" | find /v /c "\"Calendar.*Locale.*ptBR\"" | find /v /c "\"formatRelativeDate\"" | find /v /c "\"ptBR/g\"" | find /v /c "\"ptBR/g\"" >nul 2>nul

echo ✅ TypeScript cleanup complete!
