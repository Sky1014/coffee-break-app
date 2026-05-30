$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $projectRoot "package.json") -Raw | ConvertFrom-Json).version
$releaseRoot = Join-Path $projectRoot "release"
$releaseDir = Join-Path $releaseRoot "CoffeeBreak-$version-win-x64"
$zipPath = Join-Path $releaseRoot "CoffeeBreak-$version-win-x64.zip"
$electronDist = Join-Path $projectRoot "node_modules\electron\dist"
$resolvedProject = [System.IO.Path]::GetFullPath($projectRoot)
$resolvedReleaseDir = [System.IO.Path]::GetFullPath($releaseDir)
$resolvedZip = [System.IO.Path]::GetFullPath($zipPath)

if (-not $resolvedReleaseDir.StartsWith($resolvedProject, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to delete or write outside the project root: $resolvedReleaseDir"
}

if (-not $resolvedZip.StartsWith($resolvedProject, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to delete or write outside the project root: $resolvedZip"
}

if (-not (Test-Path -LiteralPath (Join-Path $electronDist "electron.exe"))) {
    throw "Electron runtime was not found. Run npm.cmd install first."
}

if (Test-Path -LiteralPath $releaseDir) {
    Remove-Item -LiteralPath $releaseDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

Get-ChildItem -LiteralPath $electronDist | Where-Object { $_.Name -ne "electron.exe" } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $releaseDir -Recurse -Force
}

Copy-Item -LiteralPath (Join-Path $electronDist "electron.exe") -Destination (Join-Path $releaseDir "CoffeeBreak.exe") -Force

$rcedit = Join-Path $projectRoot "node_modules\rcedit\bin\rcedit-x64.exe"
if (Test-Path -LiteralPath $rcedit) {
    & $rcedit (Join-Path $releaseDir "CoffeeBreak.exe") `
        --set-icon (Join-Path $projectRoot "assets\coffee-break.ico") `
        --set-version-string "ProductName" "Coffee Break" `
        --set-version-string "FileDescription" "Coffee Break" `
        --set-version-string "CompanyName" "Coffee Break" `
        --set-version-string "OriginalFilename" "CoffeeBreak.exe" `
        --set-file-version $version `
        --set-product-version $version
} else {
    Write-Warning "rcedit not found; CoffeeBreak.exe will keep Electron's default file icon."
}

$appDir = Join-Path $releaseDir "resources\app"
New-Item -ItemType Directory -Force -Path $appDir | Out-Null

Copy-Item -LiteralPath (Join-Path $projectRoot "dist") -Destination $appDir -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "electron") -Destination $appDir -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "assets") -Destination $appDir -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "package.json") -Destination $appDir -Force

if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $releaseDir -DestinationPath $zipPath -Force

$files = Get-ChildItem -LiteralPath $releaseDir -Recurse -File
[pscustomobject]@{
    ReleaseDir = $releaseDir
    Zip = $zipPath
    FolderSizeMB = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    FileCount = ($files | Measure-Object).Count
    ZipSizeMB = [math]::Round((Get-Item -LiteralPath $zipPath).Length / 1MB, 2)
}
