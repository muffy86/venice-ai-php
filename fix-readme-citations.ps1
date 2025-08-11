# Fix README.md citations only

Write-Host "Fixing README.md citations..." -ForegroundColor Yellow

# Read the current README.md content
$content = Get-Content 'README.md' -Raw

# Apply the citation fixes
$content = $content -replace 'https://docs\.venice\.ai', 'https://venice.ai/docs'
$content = $content -replace 'https://github\.com/venice-ai/venice-ai-php/issues', 'https://github.com/muffy86/venice-ai-php/issues'
$content = $content -replace 'https://community\.venice\.ai', 'https://venice.ai/community'
$content = $content -replace 'We welcome contributions! Please see our \[Contributing Guide\]\(CONTRIBUTING\.md\) for details\.', 'We welcome contributions! Please follow these steps:'
$content = $content -replace 'See \[CHANGELOG\.md\]\(CHANGELOG\.md\) for version history and updates\.', 'For version history and updates, please check the git commit history and releases section.'

# Write the corrected content back
$content | Set-Content 'README.md' -NoNewline

Write-Host "README.md citations fixed!" -ForegroundColor Green
