# Script de Test Automatisé des Scénarios Métiers DevCapacity Manager
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  LANCEMENT DU BANC DE TESTS E2E - DEVCAPACITY MANAGER" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$API = "http://localhost:4000/api/v1"
$script:testsPassed = 0
$script:testsFailed = 0

function Assert-Test {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$Details = ""
    )
    if ($Condition) {
        Write-Host " [PASS] $Name" -ForegroundColor Green
        if ($Details) { Write-Host "        -> $Details" -ForegroundColor Gray }
        $script:testsPassed++
    } else {
        Write-Host " [FAIL] $Name" -ForegroundColor Red
        if ($Details) { Write-Host "        -> $Details" -ForegroundColor Yellow }
        $script:testsFailed++
    }
}

# --- TEST 1 : Health Check & Database ---
try {
    $health = Invoke-RestMethod -Uri "$API/health" -Method Get
    $cond = ($health.status -eq "ok" -and $health.database -eq "up")
    $det = "Statut=$($health.status), Base=$($health.database), Service=$($health.service)"
    Assert-Test -Name "TEST 1 : Sante du Systeme et Connexion PostgreSQL 16" -Condition $cond -Details $det
} catch {
    Assert-Test -Name "TEST 1 : Sante du Systeme et Connexion PostgreSQL 16" -Condition $false -Details $_.Exception.Message
}

# --- TEST 2 : Référentiel Équipe des 7 Développeurs Réels ---
try {
    $devs = Invoke-RestMethod -Uri "$API/developers" -Method Get
    $emails = $devs | ForEach-Object { $_.email }
    $hasAnoop = $emails -contains "anoop.pandimukkula@safirconsulting.net"
    $hasHassane = $emails -contains "hassane.bocoum@safirconsulting.net"
    $hasNevrit = $emails -contains "nevrit.ahua@safirconsulting.net"
    $hasFatoumata = $emails -contains "fatoumata.traore@safirconsulting.net"
    $hasKorotoumou = $emails -contains "korotoumou.thiam@safirconsulting.net"
    $hasMoha = $emails -contains "mohadicko95@gmail.com"
    $hasJeanPhilippe = $emails -contains "jeanphilippe.ebrottie@safirconsulting.net"
    $allPresent = $hasAnoop -and $hasHassane -and $hasNevrit -and $hasFatoumata -and $hasKorotoumou -and $hasMoha -and $hasJeanPhilippe
    $det = "Nombre total de developpeurs: $($devs.Count). Tous les 7 profils Safir sont verifies."
    Assert-Test -Name "TEST 2 : Referentiel des 7 Developpeurs Reels Safir" -Condition ($devs.Count -ge 7 -and $allPresent) -Details $det
} catch {
    Assert-Test -Name "TEST 2 : Referentiel des 7 Developpeurs Reels Safir" -Condition $false -Details $_.Exception.Message
}

# --- TEST 3 : Simulation 1 — E-mail Consultante Safir (Mélissa Diakité) ---
$simConsultant = $null
try {
    $body = @{
        senderEmail = "melissa.diakite@safirconsulting.net"
        senderName = "Melissa Diakite"
        subject = "[Test E2E] Addon Validation Commandes SAP B1"
        bodyText = "Bonjour Aliko, voici les specifications pour le workflow d approbation d achats SAP B1."
    } | ConvertTo-Json

    $simConsultant = Invoke-RestMethod -Uri "$API/emails/simulate" -Method Post -Body $body -ContentType "application/json"
    $isConsultant = ($simConsultant.senderKind -eq "CONSULTANT" -and $simConsultant.isPersonalDomain -eq $false)
    $det = "Expediteur=$($simConsultant.senderEmail), SenderKind=$($simConsultant.senderKind), PersonalDomain=$($simConsultant.isPersonalDomain)"
    Assert-Test -Name "TEST 3 : Reconnaissance E-mail Consultante Safir (@safirconsulting.net)" -Condition $isConsultant -Details $det
} catch {
    Assert-Test -Name "TEST 3 : Reconnaissance E-mail Consultante Safir (@safirconsulting.net)" -Condition $false -Details $_.Exception.Message
}

# --- TEST 4 : Simulation 2 — E-mail Contact Client Officiel (Omega Logistics) ---
try {
    $bodyClient = @{
        senderEmail = "c.durand@client-omega.com"
        senderName = "Christian Durand"
        subject = "[Test E2E] Evolution Passerelle WMS SAP B1"
        bodyText = "Bonjour Aliko, nous souhaitons ajouter la gestion des numeros de serie dans la passerelle."
    } | ConvertTo-Json

    $simClient = Invoke-RestMethod -Uri "$API/emails/simulate" -Method Post -Body $bodyClient -ContentType "application/json"
    $isClient = ($simClient.senderKind -eq "CLIENT_CONTACT" -and $simClient.isPersonalDomain -eq $false)
    $det = "Expediteur=$($simClient.senderEmail), SenderKind=$($simClient.senderKind), PersonalDomain=$($simClient.isPersonalDomain)"
    Assert-Test -Name "TEST 4 : Reconnaissance E-mail Client Officiel (@client-omega.com)" -Condition $isClient -Details $det
} catch {
    Assert-Test -Name "TEST 4 : Reconnaissance E-mail Client Officiel (@client-omega.com)" -Condition $false -Details $_.Exception.Message
}

# --- TEST 5 : Simulation 3 — E-mail Tiers Extérieur Inconnu ---
try {
    $bodyExternal = @{
        senderEmail = "contact@societe-nouvelle-industrie.fr"
        senderName = "Alain Moreau"
        subject = "[Test E2E] Demande de renseignements integration SAP S/4HANA"
        bodyText = "Bonjour, nous cherchons un integrateur specialise CDS Views S/4HANA."
    } | ConvertTo-Json

    $simExt = Invoke-RestMethod -Uri "$API/emails/simulate" -Method Post -Body $bodyExternal -ContentType "application/json"
    $isUnknown = ($simExt.senderKind -eq "UNKNOWN" -and $simExt.isPersonalDomain -eq $false)
    $det = "Expediteur=$($simExt.senderEmail), SenderKind=$($simExt.senderKind), PersonalDomain=$($simExt.isPersonalDomain)"
    Assert-Test -Name "TEST 5 : Detection Personne Exterieure Inconnue" -Condition $isUnknown -Details $det
} catch {
    Assert-Test -Name "TEST 5 : Detection Personne Exterieure Inconnue" -Condition $false -Details $_.Exception.Message
}

# --- TEST 6 : Simulation 4 — E-mail Adresse Personnelle (Vigilance) ---
try {
    $bodyPerso = @{
        senderEmail = "consultant.freelance92@gmail.com"
        senderName = "Patrick Freelance"
        subject = "[Test E2E] Demande d acces direct base SAP"
        bodyText = "Bonjour Aliko, merci de m envoyer les acces au serveur SAP B1 pour intervention."
    } | ConvertTo-Json

    $simPerso = Invoke-RestMethod -Uri "$API/emails/simulate" -Method Post -Body $bodyPerso -ContentType "application/json"
    $isVigilance = ($simPerso.isPersonalDomain -eq $true -and $simPerso.senderKind -eq "UNKNOWN")
    $det = "Expediteur=$($simPerso.senderEmail), PersonalDomain=$($simPerso.isPersonalDomain), SenderKind=$($simPerso.senderKind)"
    Assert-Test -Name "TEST 6 : Detection et Alerte Vigilance Anti-usurpation (Gmail personnel)" -Condition $isVigilance -Details $det
} catch {
    Assert-Test -Name "TEST 6 : Detection et Alerte Vigilance Anti-usurpation (Gmail personnel)" -Condition $false -Details $_.Exception.Message
}

# --- TEST 7 : Qualification d'un E-mail en Ticket SAP ---
$createdTicketId = $null
try {
    $qualifyBody = @{
        typeCode = "ADDON"
        priorityCode = "HIGH"
        estimatedHours = 16
        title = "Ticket Qualifie E2E : Addon Approbation Achats SAP B1"
        description = "Specifications recues de la consultante Safir Melissa Diakite pour client Omega"
    } | ConvertTo-Json

    $qualificationResult = Invoke-RestMethod -Uri "$API/emails/$($simConsultant.id)/qualify" -Method Post -Body $qualifyBody -ContentType "application/json"
    $createdTicketId = $qualificationResult.ticket.id
    $ticketRef = $qualificationResult.ticket.reference
    $cond = ($createdTicketId -ne $null -and $ticketRef -match "^ADD-")
    $det = "Reference generee: $ticketRef, ID: $createdTicketId, Statut=$($qualificationResult.ticket.status)"
    Assert-Test -Name "TEST 7 : Qualification d un e-mail en Ticket SAP" -Condition $cond -Details $det
} catch {
    Assert-Test -Name "TEST 7 : Qualification d un e-mail en Ticket SAP" -Condition $false -Details $_.Exception.Message
}

# --- TEST 8 : Algorithme de Recommandation & Scoring Multicritère ---
try {
    $tix = Invoke-RestMethod -Uri "$API/tickets" -Method Get
    $testTicket = $tix | Where-Object { $_.reference -eq "ADD-2026-0001" } | Select-Object -First 1
    if (-not $testTicket) { $testTicket = $tix[0] }

    $recs = Invoke-RestMethod -Uri "$API/tickets/$($testTicket.id)/recommendations" -Method Get
    $topDev = $recs[0]
    $cond = ($recs.Count -gt 0 -and $topDev.totalScore -gt 0)
    $det = "Candidats scores: $($recs.Count). Top Developpeur: $($topDev.developerName) (Score: $($topDev.totalScore)%)"
    Assert-Test -Name "TEST 8 : Moteur de Recommandation et Scoring Multicritere" -Condition $cond -Details $det
} catch {
    Assert-Test -Name "TEST 8 : Moteur de Recommandation et Scoring Multicritere" -Condition $cond -Details $det
}

# --- TEST 9 : Tableau de Bord & API Next.js ---
try {
    $nextRes = (Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5).StatusCode
    $det = "Code HTTP: $nextRes (Tableau de bord operationnel)"
    Assert-Test -Name "TEST 9 : Disponibilite du Dashboard Next.js 15" -Condition ($nextRes -eq 200) -Details $det
} catch {
    Assert-Test -Name "TEST 9 : Disponibilite du Dashboard Next.js 15" -Condition $false -Details $_.Exception.Message
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  RESUME DU BANC DE TESTS : $script:testsPassed PASS / $script:testsFailed FAIL" -ForegroundColor $(if ($script:testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan
