$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $projectRoot "package.json") -Raw | ConvertFrom-Json).version
$releaseDir = Join-Path $projectRoot "release"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

$sourceZip = Join-Path $releaseDir "CoffeeBreak-$version-source-code.zip"

if (Test-Path -LiteralPath $sourceZip) {
    Remove-Item -LiteralPath $sourceZip -Force
}

$sourceFiles = @(
    "src",
    "electron",
    "assets",
    "scripts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.mjs",
    "index.html",
    "LICENSE",
    "README.md"
)

$existingFiles = $sourceFiles | Where-Object { Test-Path (Join-Path $projectRoot $_) }

Compress-Archive -LiteralPath ($existingFiles | ForEach-Object { Join-Path $projectRoot $_ }) -DestinationPath $sourceZip -Force

[pscustomobject]@{
    SourceZip = $sourceZip
    ZipSizeMB = [math]::Round((Get-Item -LiteralPath $sourceZip).Length / 1MB, 2)
    IncludedFiles = $existingFiles -join ", "
}
