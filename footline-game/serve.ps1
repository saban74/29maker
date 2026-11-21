# Footline local launcher: serves this folder on http://localhost:8723 and opens the game in its own app window.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8723
$url  = "http://localhost:$port/game.html"
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.json'='application/json'; '.webmanifest'='application/manifest+json';
           '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.mp3'='audio/mpeg'; '.wav'='audio/wav'; '.css'='text/css'; '.txt'='text/plain; charset=utf-8' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() } catch { Write-Host "Port $port is busy. The game may already be running."; Start-Process $url; exit }
Write-Host "Footline is running at $url"
Write-Host "Close this window to stop the game server."
# open in an app-style window (no address bar). Edge is on every Windows 10/11 PC; fall back to Chrome or the default browser.
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe","$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe","${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe","$env:LocalAppData\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($chrome) { Start-Process $chrome "--app=$url --window-size=1600,1000" }
elseif ($edge) { Start-Process $edge "--app=$url --window-size=1600,1000" }
else { Start-Process $url }
while ($listener.IsListening) {
  $ctx = $listener.GetContext(); $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/')); if ($rel -eq '') { $rel = 'index.html' }
    $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if (-not $full.StartsWith($root) -or -not (Test-Path $full -PathType Leaf)) { $res.StatusCode = 404 }
    else {
      $ext = [IO.Path]::GetExtension($full).ToLower(); $res.ContentType = $(if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' })
      $bytes = [IO.File]::ReadAllBytes($full); $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch { $res.StatusCode = 500 } finally { $res.Close() }
}
