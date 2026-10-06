Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path (Join-Path $PSScriptRoot "..\assets\icon.png")
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $src.Width
$h = $src.Height

$dest = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$srcData = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$destData = $dest.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$byteCount = $srcData.Stride * $h
$srcBytes = New-Object byte[] $byteCount
$destBytes = New-Object byte[] $byteCount

[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $byteCount)

# Background color target: R=61, G=98, B=80
$bgR = 61.0
$bgG = 98.0
$bgB = 80.0

for ($i = 0; $i -lt $byteCount; $i += 4) {
    $b = [double]$srcBytes[$i]
    $g = [double]$srcBytes[$i + 1]
    $r = [double]$srcBytes[$i + 2]

    $dist = [Math]::Sqrt(($r - $bgR)*($r - $bgR) + ($g - $bgG)*($g - $bgG) + ($b - $bgB)*($b - $bgB))

    $alpha = 0
    if ($dist -ge 38) {
        $alpha = 255
    } elseif ($dist -gt 18) {
        $alpha = [int](255 * ($dist - 18) / 20.0)
    }

    $destBytes[$i] = 255      # B
    $destBytes[$i + 1] = 255  # G
    $destBytes[$i + 2] = 255  # R
    $destBytes[$i + 3] = [byte]$alpha  # A
}

[System.Runtime.InteropServices.Marshal]::Copy($destBytes, 0, $destData.Scan0, $byteCount)
$src.UnlockBits($srcData)
$dest.UnlockBits($destData)
$src.Dispose()

function Save-ScaledIcon {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$size,
        [float]$paddingFraction,
        [string]$outputPath
    )

    $outBmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($outBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $pad = [int]($size * $paddingFraction)
    $drawSize = $size - ($pad * 2)
    $g.DrawImage($source, $pad, $pad, $drawSize, $drawSize)
    $g.Dispose()

    $targetFile = Join-Path $PSScriptRoot $outputPath
    $outBmp.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
    Write-Host "Generated: $targetFile ($size x $size)"
}

# 1. Standard Expo notification icon (96x96, 8% padding)
Save-ScaledIcon -source $dest -size 96 -paddingFraction 0.08 -outputPath "..\assets\notification-icon.png"

# 2. Android adaptive monochrome icon (432x432, centered in the inner 66% safe zone -> ~22% padding)
Save-ScaledIcon -source $dest -size 432 -paddingFraction 0.20 -outputPath "..\assets\android-icon-monochrome.png"

$dest.Dispose()
Write-Host "All icons generated successfully!"
