# PowerShell script to start MongoDB replica set (rs0) on port 27018
$mongoDataDir = Join-Path $PSScriptRoot ".mongo_data"
if (-not (Test-Path $mongoDataDir)) {
    New-Item -ItemType Directory -Path $mongoDataDir | Out-Null
}

$mongodPaths = @(
    "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
)

$mongodExe = $null
foreach ($path in $mongodPaths) {
    if (Test-Path $path) {
        $mongodExe = $path
        break
    }
}

if (-not $mongodExe) {
    $mongodCmd = Get-Command mongod -ErrorAction SilentlyContinue
    if ($mongodCmd) {
        $mongodExe = $mongodCmd.Source
    }
}

if (-not $mongodExe) {
    Write-Error "Could not find mongod.exe. Please ensure MongoDB is installed."
    exit 1
}

Write-Host "Starting MongoDB replica set (rs0) on port 27018 using $mongodExe..." -ForegroundColor Cyan
& $mongodExe --dbpath $mongoDataDir --port 27018 --replSet rs0
