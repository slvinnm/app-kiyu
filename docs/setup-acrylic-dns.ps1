$ErrorActionPreference = 'Stop'

# 1. Wildcard entries in Acrylic's hosts file.
$hostsPath = 'C:\Program Files (x86)\Acrylic DNS Proxy\AcrylicHosts.txt'
$line = '127.0.0.1 kiyu.test *.kiyu.test'
$content = Get-Content -LiteralPath $hostsPath -Raw
if ($content -notmatch [regex]::Escape('*.kiyu.test')) {
    Add-Content -LiteralPath $hostsPath -Value "`r`n$line"
    Write-Host "hosts: added '$line'"
} else {
    Write-Host 'hosts: entry already present'
}

# 2. Point the active adapter at Acrylic (loopback). Acrylic forwards upstream.
$adapter = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -notmatch 'Loopback' } | Select-Object -First 1
if (-not $adapter) { throw 'No active adapter found.' }
$previous = (Get-DnsClientServerAddress -InterfaceIndex $adapter.ifIndex -AddressFamily IPv4).ServerAddresses
Write-Host "adapter: $($adapter.Name) previous DNS = $($previous -join ',')"
Set-DnsClientServerAddress -InterfaceIndex $adapter.ifIndex -ServerAddresses 127.0.0.1
Write-Host 'adapter: DNS set to 127.0.0.1'

# 3. Restart the resolver so the new hosts file is loaded.
Restart-Service -Name AcrylicDNSProxySvc -Force
Write-Host 'service: AcrylicDNSProxySvc restarted'

Clear-DnsClientCache
Write-Host 'dns cache cleared'
