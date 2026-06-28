# Wymaga PowerShell URUCHOMIONEGO JAKO ADMINISTRATOR.
# PPM na PowerShell -> Uruchom jako administrator

$ruleName = "Expo Metro 8081"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host ""
  Write-Host "BRAK UPRAWNIEN ADMINISTRATORA" -ForegroundColor Red
  Write-Host "Kliknij PPM na PowerShell -> Uruchom jako administrator, potem:"
  Write-Host "  cd C:\Users\User\Desktop\kidelo-pregna\kidelo-complete\kidelo-app"
  Write-Host "  .\scripts\allow-firewall.ps1"
  Write-Host ""
  Write-Host "Alternatywa BEZ admina (telefon pod USB):"
  Write-Host "  adb reverse tcp:8081 tcp:8081"
  Write-Host "  npm run start:usb"
  Write-Host ""
  exit 1
}

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Regula juz istnieje: $ruleName" -ForegroundColor Green
} else {
  try {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -ErrorAction Stop | Out-Null
    Write-Host "Dodano regule firewall: $ruleName (port 8081)" -ForegroundColor Green
  } catch {
    Write-Host "Nie udalo sie dodac reguly: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
  }
}

Write-Host "Teraz w zwyklym PowerShell: npm run start:lan-win"
