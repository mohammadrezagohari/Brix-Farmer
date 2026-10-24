$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:3000'
$page = Invoke-WebRequest -UseBasicParsing -Uri $base
if ($page.StatusCode -ne 200) { throw 'Frontend unavailable' }
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
function Invoke-Api($Path, $Body) {
    $csrf = Invoke-RestMethod -Uri "$base/api/v1/csrf" -WebSession $session
    $headers = @{ Accept = 'application/json'; 'X-CSRF-TOKEN' = $csrf.token }
    Invoke-RestMethod -Uri "$base/api/v1/$Path" -Method Post -ContentType 'application/json' -Headers $headers -WebSession $session -Body ($Body | ConvertTo-Json)
}
$suffix = [Guid]::NewGuid().ToString('N')
$password = [Guid]::NewGuid().ToString('N')
$user = Invoke-Api 'register' @{name='Synthetic HTTP smoke';email="smoke-$suffix@example.test";password=$password;password_confirmation=$password}
$org = Invoke-Api 'organizations' @{name="Synthetic HTTP smoke $suffix"}
$csrf = Invoke-RestMethod -Uri "$base/api/v1/csrf" -WebSession $session
$headers = @{Accept='application/json'; 'X-CSRF-TOKEN'=$csrf.token; 'X-Organization-ID'=[string]$org.data.id}
$body = @{product='Synthetic smoke pistachios';origin_country='IR';on_hand_kg='50000';minimum_order_kg='1000'} | ConvertTo-Json
$lot = Invoke-RestMethod -Uri "$base/api/v1/inventory-lots" -Method Post -ContentType 'application/json' -Headers $headers -WebSession $session -Body $body
if ($lot.data.product -ne 'Synthetic smoke pistachios') { throw 'Lot persistence failed' }
$read = Invoke-RestMethod -Uri "$base/api/v1/inventory-lots" -Headers $headers -WebSession $session
if ($read.data.Count -ne 1) { throw 'Unexpected organization data' }
Invoke-Api 'logout' @{} | Out-Null
Write-Output 'PASS: frontend HTTP, proxy, CSRF, registration, session, organization, persisted lot, logout.'
