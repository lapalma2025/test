# Uruchom Expo w trybie LAN z poprawnym IP (pomija wirtualne adaptery WSL/Hyper-V).
$ip = (
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -notmatch '^127\.' -and
    $_.IPAddress -notmatch '^169\.254' -and
    $_.InterfaceAlias -notmatch 'Virtual|WSL|Hyper-V|vEthernet|Loopback'
  } |
  Select-Object -First 1
).IPAddress

if (-not $ip) {
  Write-Host "Nie znaleziono IP Wi-Fi. Sprawdz polaczenie sieciowe." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "LAN IP: $ip" -ForegroundColor Green
Write-Host "W Expo Go wpisz recznie: exp://${ip}:8081" -ForegroundColor Cyan
Write-Host "Jesli nie dziala, otworz PowerShell jako Admin i uruchom: scripts\allow-firewall.ps1" -ForegroundColor Yellow
Write-Host ""

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
Set-Location $PSScriptRoot\..
npx expo start --lan --clear
