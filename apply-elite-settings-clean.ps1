Write-Host "🚀 Applying Elite VS Code Settings..." -ForegroundColor Cyan

$backupPath = "C:\Users\aiech\AppData\Roaming\Code\User\settings.json.backup"
$currentSettings = "C:\Users\aiech\AppData\Roaming\Code\User\settings.json"
$eliteSettings = "c:\Users\aiech\OneDrive\Documents\GitHub\venice-ai-php\elite-settings-perfect.json"

try {
    if (Test-Path $currentSettings) {
        Copy-Item $currentSettings $backupPath -Force
        Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
    }

    $vscodeProcesses = Get-Process "Code" -ErrorAction SilentlyContinue
    if ($vscodeProcesses) {
        Write-Host "⚠️ VS Code is running. Please close it and press Enter to continue..." -ForegroundColor Yellow
        Read-Host
    }

    if (Test-Path $eliteSettings) {
        Copy-Item $eliteSettings $currentSettings -Force
        Write-Host "✅ Elite settings applied successfully!" -ForegroundColor Green
        Write-Host "📊 Settings include:" -ForegroundColor Cyan
        Write-Host "   • 1000+ AI Agent Team Configuration" -ForegroundColor White
        Write-Host "   • Advanced AI Assistants (Copilot, TabNine, Codeium, BlackBox)" -ForegroundColor White
        Write-Host "   • Elite Editor Configuration" -ForegroundColor White
        Write-Host "   • Comprehensive Language Support" -ForegroundColor White
        Write-Host "   • Performance Optimizations" -ForegroundColor White
        Write-Host "   • Security & Accessibility Features" -ForegroundColor White
    } else {
        Write-Host "❌ Elite settings file not found: $eliteSettings" -ForegroundColor Red
        exit 1
    }

    $content = Get-Content $currentSettings -Raw
    if ($content.StartsWith("{") -and $content.EndsWith("}")) {
        Write-Host "✅ Settings file structure verified" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Settings file may have structural issues" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "🎉 ELITE VS CODE ENVIRONMENT READY!" -ForegroundColor Green
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart VS Code to apply all settings" -ForegroundColor White
    Write-Host "   2. Install recommended extensions if prompted" -ForegroundColor White
    Write-Host "   3. Configure API keys for AI services" -ForegroundColor White
    Write-Host "   4. Test the AI agent team functionality" -ForegroundColor White

} catch {
    Write-Host "❌ Error applying settings: $($_.Exception.Message)" -ForegroundColor Red

    if (Test-Path $backupPath) {
        Copy-Item $backupPath $currentSettings -Force
        Write-Host "🔄 Backup restored" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host ""
Write-Host "💡 Pro Tip: Your previous settings are backed up at $backupPath" -ForegroundColor Cyan
