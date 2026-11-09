# 29 Crew 설치 도우미 (install.bat 이 이 파일을 실행해요)
# 하는 일: 필요한 프로그램 확인·설치 → 바탕화면 바로가기 → (선택) 윈도우 시작 시 자동 실행 → 점검
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Say($text, $color = "Gray") { Write-Host $text -ForegroundColor $color }
function Ask($question) {
    # Enter 또는 y 는 "예", n(한글 자판 ㅜ 포함) 또는 "아니" 로 시작하면 "아니요"
    $a = (Read-Host "$question [Y/n]").Trim()
    return -not ($a -match "^(n|ㅜ|아니)")
}
function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}
function Has($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Find-Python {
    if (Has "py") { & py -3 -c "import sys" 2>$null; if ($LASTEXITCODE -eq 0) { return "py" } }
    if (Has "python") { & python -c "import sys" 2>$null; if ($LASTEXITCODE -eq 0) { return "python" } }
    return $null
}
function Install-Winget($id, $name) {
    if (-not (Has "winget")) {
        Say "  winget(윈도우 앱 설치 도구)이 없어서 자동 설치를 못 해요. $name 을(를) 직접 설치해 주세요." "Yellow"
        return
    }
    Say "  $name 설치 중... (몇 분 걸릴 수 있어요)" "Cyan"
    winget install --id $id -e --accept-package-agreements --accept-source-agreements
    Refresh-Path
}

Say ""
Say "==============================================" "Magenta"
Say "   29 Crew 설치 도우미" "Magenta"
Say "==============================================" "Magenta"
Say "설치 위치: $Root"
Say ""

# 1. Python (필수)
Say "[1/6] Python 확인" "White"
$py = Find-Python
if (-not $py) {
    Say "  Python이 없어요. 29 Crew를 실행하려면 꼭 필요해요." "Yellow"
    if (Ask "  지금 Python 3.12를 설치할까요?") { Install-Winget "Python.Python.3.12" "Python 3.12"; $py = Find-Python }
}
if ($py) { Say "  ✅ Python 준비됨 ($py)" "Green" } else { Say "  ❌ Python이 없어요. 설치 후 이 도우미를 다시 실행해 주세요." "Red"; Read-Host "Enter를 누르면 닫혀요"; exit 1 }

# 2. ffmpeg (영상 만들기)
Say "[2/6] ffmpeg 확인 (영상 만들기)" "White"
if (Has "ffmpeg") { Say "  ✅ ffmpeg 준비됨" "Green" }
elseif (Ask "  ffmpeg가 없어요. 영상을 만들려면 필요해요. 설치할까요?") { Install-Winget "Gyan.FFmpeg" "ffmpeg"; if (Has "ffmpeg") { Say "  ✅ ffmpeg 설치됨" "Green" } else { Say "  ⚠️ 설치 후 PC를 다시 켜면 인식될 수 있어요." "Yellow" } }
else { Say "  건너뜀 (영상 만들기는 나중에 설치하면 돼요)" }

# 3. edge-tts (무료 목소리, 선택)
Say "[3/6] edge-tts 확인 (무료 목소리, 선택)" "White"
& $py -c "import edge_tts" 2>$null
if ($LASTEXITCODE -eq 0) { Say "  ✅ edge-tts 준비됨" "Green" }
elseif (Ask "  무료 목소리(edge-tts)를 설치할까요?") { & $py -m pip install --user edge-tts; Say "  ✅ edge-tts 설치 완료" "Green" }
else { Say "  건너뜀" }

# 4. Git (업데이트 받기, 선택) · Claude Code (미션 실행)
Say "[4/6] Git · Claude Code 확인" "White"
if (Has "git") { Say "  ✅ Git 준비됨 (업데이트: git pull)" "Green" }
elseif (Ask "  Git이 없어요. 새 버전을 받을 때 필요해요. 설치할까요?") { Install-Winget "Git.Git" "Git" }
if (Has "claude") { Say "  ✅ Claude Code 준비됨" "Green" }
else { Say "  ⚠️ claude 명령을 찾지 못했어요. 미션을 실행하려면 Claude Code가 필요해요. 설치 후 대시보드 설정 화면에서 다시 확인하세요." "Yellow" }

# 5. 바로가기
Say "[5/6] 바로가기 만들기" "White"
$shell = New-Object -ComObject WScript.Shell
$target = Join-Path $Root "start-crew.bat"
function Make-Shortcut($path) {
    $s = $shell.CreateShortcut($path)
    $s.TargetPath = $target
    $s.WorkingDirectory = $Root
    $s.Description = "29 Crew 대시보드"
    $s.Save()
}
$desktop = [Environment]::GetFolderPath("Desktop")
Make-Shortcut (Join-Path $desktop "29 Crew.lnk")
Say "  ✅ 바탕화면에 '29 Crew' 바로가기를 만들었어요" "Green"
$startup = Join-Path ([Environment]::GetFolderPath("Startup")) "29 Crew.lnk"
if (Ask "  윈도우를 켤 때 29 Crew도 자동으로 켤까요? (게시 예약을 쓰면 추천)") { Make-Shortcut $startup; Say "  ✅ 자동 실행을 켰어요 (끄려면 이 도우미를 다시 실행해서 n)" "Green" }
elseif (Test-Path $startup) { Remove-Item $startup; Say "  자동 실행을 껐어요" }

# 6. 점검
Say "[6/6] 최종 점검" "White"
& $py -m crew29 check
Say ""
Say "설치가 끝났어요! 바탕화면의 '29 Crew'를 더블클릭하면 켜져요." "Green"
Say "주소: http://127.0.0.1:8129/   (끄려면 검은 창에서 Ctrl + C)"
Say ""
if (Ask "지금 바로 켤까요?") { Start-Process -FilePath $target -WorkingDirectory $Root }
