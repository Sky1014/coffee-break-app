$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $projectRoot "assets"
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-RoundedRectanglePath {
    param(
        [System.Drawing.Rectangle]$Rect,
        [int]$Radius
    )

    $diameter = $Radius * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Fill-RoundedRectangle {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Brush]$Brush,
        [System.Drawing.Rectangle]$Rect,
        [int]$Radius
    )

    $path = New-RoundedRectanglePath -Rect $Rect -Radius $Radius
    $Graphics.FillPath($Brush, $path)
    $path.Dispose()
}

function Draw-RoundedRectangle {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Pen]$Pen,
        [System.Drawing.Rectangle]$Rect,
        [int]$Radius
    )

    $path = New-RoundedRectanglePath -Rect $Rect -Radius $Radius
    $Graphics.DrawPath($Pen, $path)
    $path.Dispose()
}

function New-CoffeeBitmap {
    param(
        [int]$Size,
        [string]$Path
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $scale = $Size / 256.0
    function S([float]$v) { return [int][math]::Round($v * $scale) }

    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle 0, 0, $Size, $Size),
        [System.Drawing.Color]::FromArgb(255, 250, 244, 235),
        [System.Drawing.Color]::FromArgb(255, 220, 202, 178),
        90
    )
    Fill-RoundedRectangle -Graphics $g -Brush $bgBrush -Rect (New-Object System.Drawing.Rectangle (S 14), (S 14), (S 228), (S 228)) -Radius (S 44)

    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(36, 64, 38, 28))
    $g.FillEllipse($shadowBrush, (S 62), (S 184), (S 112), (S 18))

    $outlinePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 84, 52, 39)), (S 12)
    $cupRect = New-Object System.Drawing.Rectangle (S 55), (S 94), (S 112), (S 78)
    Draw-RoundedRectangle -Graphics $g -Pen $outlinePen -Rect $cupRect -Radius (S 25)

    $fillBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle (S 62), (S 118), (S 98), (S 47)),
        [System.Drawing.Color]::FromArgb(255, 197, 153, 102),
        [System.Drawing.Color]::FromArgb(255, 122, 78, 51),
        90
    )
    Fill-RoundedRectangle -Graphics $g -Brush $fillBrush -Rect (New-Object System.Drawing.Rectangle (S 65), (S 124), (S 92), (S 39)) -Radius (S 14)

    $handlePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 84, 52, 39)), (S 12)
    $g.DrawArc($handlePen, (S 153), (S 111), (S 54), (S 46), -80, 210)

    $steamPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(160, 142, 95, 65)), (S 9)
    $steamPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $steamPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawBezier($steamPen, (S 92), (S 78), (S 78), (S 62), (S 105), (S 50), (S 91), (S 34))
    $g.DrawBezier($steamPen, (S 134), (S 78), (S 118), (S 60), (S 151), (S 48), (S 133), (S 30))

    $highlightBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(120, 255, 255, 255))
    $g.FillEllipse($highlightBrush, (S 65), (S 36), (S 35), (S 20))

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
}

function Write-Ico {
    param(
        [string[]]$PngPaths,
        [string]$IconPath
    )

    $streams = @()
    foreach ($pngPath in $PngPaths) {
        $streams += ,([System.IO.File]::ReadAllBytes($pngPath))
    }

    $fs = [System.IO.File]::Create($IconPath)
    $writer = New-Object System.IO.BinaryWriter $fs
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$streams.Count)

    $offset = 6 + (16 * $streams.Count)
    for ($i = 0; $i -lt $streams.Count; $i++) {
        $image = [System.Drawing.Image]::FromFile($PngPaths[$i])
        $w = if ($image.Width -ge 256) { 0 } else { [byte]$image.Width }
        $h = if ($image.Height -ge 256) { 0 } else { [byte]$image.Height }
        $image.Dispose()
        $writer.Write([byte]$w)
        $writer.Write([byte]$h)
        $writer.Write([byte]0)
        $writer.Write([byte]0)
        $writer.Write([UInt16]1)
        $writer.Write([UInt16]32)
        $writer.Write([UInt32]$streams[$i].Length)
        $writer.Write([UInt32]$offset)
        $offset += $streams[$i].Length
    }

    foreach ($bytes in $streams) {
        $writer.Write($bytes)
    }

    $writer.Dispose()
    $fs.Dispose()
}

function Write-CoffeePourWav {
    param(
        [string]$Path,
        [int]$DurationSeconds = 60,
        [int]$SampleRate = 44100
    )

    $sampleCount = $DurationSeconds * $SampleRate
    $data = New-Object byte[] ($sampleCount * 2)
    $rng = New-Object System.Random 92
    $last = 0.0

    for ($i = 0; $i -lt $sampleCount; $i++) {
        $t = $i / [double]$SampleRate
        $progress = $t / $DurationSeconds
        $pourEnvelope = [math]::Pow([math]::Max(0, 1 - $progress), 0.35)
        $cupEnvelope = [math]::Min(1, $progress * 1.6)
        $noise = (($rng.NextDouble() * 2.0) - 1.0)
        $last = ($last * 0.965) + ($noise * 0.035)
        $stream = $last * 0.28 * $pourEnvelope
        $foam = [math]::Sin(2.0 * [math]::PI * (260 + 50 * $cupEnvelope) * $t) * 0.015 * $cupEnvelope
        $dripPulse = [math]::Sin(2.0 * [math]::PI * (6 + 10 * $progress) * $t)
        $drip = [math]::Max(0, $dripPulse) * 0.055 * (0.25 + 0.75 * $pourEnvelope)
        $sample = [math]::Max(-1, [math]::Min(1, $stream + $foam + $drip))
        $intSample = [int16][math]::Round($sample * 32767)
        $data[$i * 2] = [byte]($intSample -band 0xff)
        $data[$i * 2 + 1] = [byte](($intSample -shr 8) -band 0xff)
    }

    $fs = [System.IO.File]::Create($Path)
    $writer = New-Object System.IO.BinaryWriter $fs
    $writer.Write([Text.Encoding]::ASCII.GetBytes("RIFF"))
    $writer.Write([UInt32](36 + $data.Length))
    $writer.Write([Text.Encoding]::ASCII.GetBytes("WAVE"))
    $writer.Write([Text.Encoding]::ASCII.GetBytes("fmt "))
    $writer.Write([UInt32]16)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]1)
    $writer.Write([UInt32]$SampleRate)
    $writer.Write([UInt32]($SampleRate * 2))
    $writer.Write([UInt16]2)
    $writer.Write([UInt16]16)
    $writer.Write([Text.Encoding]::ASCII.GetBytes("data"))
    $writer.Write([UInt32]$data.Length)
    $writer.Write($data)
    $writer.Dispose()
    $fs.Dispose()
}

New-CoffeeBitmap -Size 16 -Path (Join-Path $assetDir "icon-16.png")
New-CoffeeBitmap -Size 32 -Path (Join-Path $assetDir "icon-32.png")
New-CoffeeBitmap -Size 48 -Path (Join-Path $assetDir "icon-48.png")
New-CoffeeBitmap -Size 256 -Path (Join-Path $assetDir "icon-256.png")
Copy-Item -LiteralPath (Join-Path $assetDir "icon-32.png") -Destination (Join-Path $assetDir "tray.png") -Force
Write-Ico -PngPaths @(
    (Join-Path $assetDir "icon-16.png"),
    (Join-Path $assetDir "icon-32.png"),
    (Join-Path $assetDir "icon-48.png"),
    (Join-Path $assetDir "icon-256.png")
) -IconPath (Join-Path $assetDir "coffee-break.ico")
Write-CoffeePourWav -Path (Join-Path $assetDir "coffee-pour.wav")

Get-ChildItem -LiteralPath $assetDir | Select-Object Name, Length, LastWriteTime
