# Script d'Automatisation de Scan de Sécurité OWASP ZAP Baseline
# Usage: .\scripts\run_owasp_zap_scan.ps1 -TargetUrl "http://localhost:3000"

param(
    [string]$TargetUrl = "http://localhost:3000",
    [string]$ReportOutput = "zap-report.html"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AUDIT DE SÉCURITÉ AUTOMATISÉ — OWASP ZAP BASELINE SCAN" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Cible : $TargetUrl" -ForegroundColor Yellow

# Vérification présence de Docker
$hasDocker = Get-Command docker -ErrorAction SilentlyContinue

if ($hasDocker) {
    Write-Host "[+] Lancement du conteneur officiel OWASP ZAP (ghcr.io/zaproxy/zaproxy:stable)..." -ForegroundColor Green
    docker run --rm -v "${PWD}:/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py `
        -t $TargetUrl `
        -c /zap/wrk/zap-baseline.conf `
        -r $ReportOutput `
        -I
    Write-Host "[✓] Rapport OWASP ZAP généré : $ReportOutput" -ForegroundColor Green
} else {
    Write-Host "[!] Docker n'est pas détecté localement. Exécution de l'audit unitaire OWASP ZAP Security Suite (Vitest)..." -ForegroundColor Yellow
    npx vitest run tests/owasp-zap/owasp-security.test.ts
}
