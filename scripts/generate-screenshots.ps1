Add-Type -AssemblyName System.Drawing

function Get-RoundedPath {
    param(
        [float]$x,
        [float]$y,
        [float]$width,
        [float]$height,
        [float]$radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2.0

    [void]$path.AddArc($x, $y, $d, $d, 180, 90)
    [void]$path.AddArc($x + $width - $d, $y, $d, $d, 270, 90)
    [void]$path.AddArc($x + $width - $d, $y + $height - $d, $d, $d, 0, 90)
    [void]$path.AddArc($x, $y + $height - $d, $d, $d, 90, 90)
    [void]$path.CloseFigure()
    return $path
}

$screens = @(
    @{
        Input = "assets/screenshots/screenshot-1-home.png"
        OutputBase = "screenshot-1-home"
        Tag = "TEMPORAL ORIENTATION"
        Title = "Clear Daily Orientation"
        Subtitle = "Day, date & routine schedule to reduce memory anxiety"
    },
    @{
        Input = "assets/screenshots/screenshot-2-carousel.png"
        OutputBase = "screenshot-2-carousel"
        Tag = "LOVED ONES & FAMILY"
        Title = "Cherished Memory Album"
        Subtitle = "Comforting photo cards with gentle voice readouts"
    },
    @{
        Input = "assets/screenshots/screenshot-3-reminder.png"
        OutputBase = "screenshot-3-reminder"
        Tag = "DAILY CARE ROUTINES"
        Title = "Voice-Guided Routine Alarms"
        Subtitle = "Spoken alerts for medication, hydration and meals"
    },
    @{
        Input = "assets/screenshots/screenshot-4-picture-frame.png"
        OutputBase = "screenshot-4-picture-frame"
        Tag = "BEDSIDE DOCKING"
        Title = "Ambient Picture Frame"
        Subtitle = "Full-screen photo slideshow with peaceful clock display"
    }
)

# -------------------------------------------------------------------------
# 1. iPhone 6.5" Display: 1284 x 2778 px & 1242 x 2688 px
# -------------------------------------------------------------------------
$w = 1284
$h = 2778

foreach ($item in $screens) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Calm sage & mint gradient background
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF 0, $h),
        [System.Drawing.Color]::FromArgb(255, 246, 248, 246),
        [System.Drawing.Color]::FromArgb(255, 230, 238, 232)
    )
    [void]$g.FillRectangle($bgBrush, 0, 0, $w, $h)
    $bgBrush.Dispose()

    # Category Pill
    $tagFont = New-Object System.Drawing.Font "Segoe UI", 22, [System.Drawing.FontStyle]::Bold
    $tagSize = $g.MeasureString($item.Tag, $tagFont)
    $pillW = [float]($tagSize.Width + 48)
    $pillH = [float]($tagSize.Height + 18)
    $pillX = [float](($w - $pillW) / 2.0)
    $pillY = 120.0

    $pillPath = Get-RoundedPath $pillX $pillY $pillW $pillH 20.0
    $pillBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 218, 232, 222) # Soft mint pill
    [void]$g.FillPath($pillBrush, $pillPath)
    $pillBrush.Dispose()

    $tagBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 30, 77, 56) # Deep evergreen text
    $tagFormat = New-Object System.Drawing.StringFormat
    $tagFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $tagFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $pillRectF = New-Object System.Drawing.RectangleF $pillX, ($pillY + 2), $pillW, $pillH
    [void]$g.DrawString($item.Tag, $tagFont, $tagBrush, $pillRectF, $tagFormat)
    $tagBrush.Dispose()
    $tagFont.Dispose()

    # Headline
    $titleFont = New-Object System.Drawing.Font "Segoe UI", 58, [System.Drawing.FontStyle]::Bold
    $titleBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 24, 66, 48)
    $titleFormat = New-Object System.Drawing.StringFormat
    $titleFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $titleRectF = New-Object System.Drawing.RectangleF 60, 210, ($w - 120), 130
    [void]$g.DrawString($item.Title, $titleFont, $titleBrush, $titleRectF, $titleFormat)
    $titleBrush.Dispose()
    $titleFont.Dispose()

    # Subtitle
    $subFont = New-Object System.Drawing.Font "Segoe UI", 32, [System.Drawing.FontStyle]::Regular
    $subBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 82, 105, 93)
    $subFormat = New-Object System.Drawing.StringFormat
    $subFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $subRectF = New-Object System.Drawing.RectangleF 80, 335, ($w - 160), 100
    [void]$g.DrawString($item.Subtitle, $subFont, $subBrush, $subRectF, $subFormat)
    $subBrush.Dispose()
    $subFont.Dispose()

    # Source Screenshot: 1080 x 1920 fits directly onto 1284 x 2778
    $srcImg = [System.Drawing.Image]::FromFile($item.Input)
    $targetW = 1080.0
    $targetH = 1920.0
    $targetX = [float](($w - $targetW) / 2.0)
    $targetY = 530.0

    # Soft ambient drop shadow
    $shadowPath = Get-RoundedPath ($targetX + 6) ($targetY + 16) $targetW $targetH 52.0
    $shadowBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(38, 0, 0, 0)
    [void]$g.FillPath($shadowBrush, $shadowPath)
    $shadowBrush.Dispose()

    # Premium dark phone frame border
    $borderPath = Get-RoundedPath ($targetX - 8) ($targetY - 8) ($targetW + 16) ($targetH + 16) 56.0
    $borderBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 28, 36, 32)
    [void]$g.FillPath($borderBrush, $borderPath)
    $borderBrush.Dispose()

    # Rounded clip for app screen
    $clipPath = Get-RoundedPath $targetX $targetY $targetW $targetH 48.0
    $state = $g.Save()
    [void]$g.SetClip($clipPath)
    [void]$g.DrawImage($srcImg, [float]$targetX, [float]$targetY, [float]$targetW, [float]$targetH)
    [void]$g.Restore($state)

    $srcImg.Dispose()
    $g.Dispose()

    # Save 1284 x 2778 px
    $out1284 = "assets/screenshots/ios-6.5/$($item.OutputBase)-1284x2778.png"
    $bmp.Save($out1284, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created $out1284"

    # Save 1242 x 2688 px
    $bmp1242 = New-Object System.Drawing.Bitmap 1242, 2688
    $g1242 = [System.Drawing.Graphics]::FromImage($bmp1242)
    $g1242.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    [void]$g1242.DrawImage($bmp, 0, 0, 1242, 2688)
    $g1242.Dispose()

    $out1242 = "assets/screenshots/ios-6.5/$($item.OutputBase)-1242x2688.png"
    $bmp1242.Save($out1242, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp1242.Dispose()
    Write-Host "Created $out1242"

    $bmp.Dispose()
}

# -------------------------------------------------------------------------
# 2. iPad 13" Display: 2048 x 2732 px
# -------------------------------------------------------------------------
$ipadW = 2048
$ipadH = 2732

foreach ($item in $screens) {
    $bmp = New-Object System.Drawing.Bitmap $ipadW, $ipadH
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF 0, $ipadH),
        [System.Drawing.Color]::FromArgb(255, 246, 248, 246),
        [System.Drawing.Color]::FromArgb(255, 230, 238, 232)
    )
    [void]$g.FillRectangle($bgBrush, 0, 0, $ipadW, $ipadH)
    $bgBrush.Dispose()

    # Category Pill
    $tagFont = New-Object System.Drawing.Font "Segoe UI", 30, [System.Drawing.FontStyle]::Bold
    $tagSize = $g.MeasureString($item.Tag, $tagFont)
    $pillW = [float]($tagSize.Width + 60)
    $pillH = [float]($tagSize.Height + 22)
    $pillX = [float](($ipadW - $pillW) / 2.0)
    $pillY = 130.0

    $pillPath = Get-RoundedPath $pillX $pillY $pillW $pillH 24.0
    $pillBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 218, 232, 222)
    [void]$g.FillPath($pillBrush, $pillPath)
    $pillBrush.Dispose()

    $tagBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 30, 77, 56)
    $tagFormat = New-Object System.Drawing.StringFormat
    $tagFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $tagFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $pillRectF = New-Object System.Drawing.RectangleF $pillX, ($pillY + 2), $pillW, $pillH
    [void]$g.DrawString($item.Tag, $tagFont, $tagBrush, $pillRectF, $tagFormat)
    $tagBrush.Dispose()
    $tagFont.Dispose()

    # Headline
    $titleFont = New-Object System.Drawing.Font "Segoe UI", 76, [System.Drawing.FontStyle]::Bold
    $titleBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 24, 66, 48)
    $titleFormat = New-Object System.Drawing.StringFormat
    $titleFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $titleRectF = New-Object System.Drawing.RectangleF 100, 250, ($ipadW - 200), 160
    [void]$g.DrawString($item.Title, $titleFont, $titleBrush, $titleRectF, $titleFormat)
    $titleBrush.Dispose()
    $titleFont.Dispose()

    # Subtitle
    $subFont = New-Object System.Drawing.Font "Segoe UI", 42, [System.Drawing.FontStyle]::Regular
    $subBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 82, 105, 93)
    $subFormat = New-Object System.Drawing.StringFormat
    $subFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $subRectF = New-Object System.Drawing.RectangleF 120, 400, ($ipadW - 240), 120
    [void]$g.DrawString($item.Subtitle, $subFont, $subBrush, $subRectF, $subFormat)
    $subBrush.Dispose()
    $subFont.Dispose()

    # Screenshot inside iPad frame
    $srcImg = [System.Drawing.Image]::FromFile($item.Input)
    $aspect = $srcImg.Width / $srcImg.Height
    $targetW = 1140.0
    $targetH = [float]($targetW / $aspect)
    $targetX = [float](($ipadW - $targetW) / 2.0)
    $targetY = 580.0

    # Shadow
    $shadowPath = Get-RoundedPath ($targetX + 8) ($targetY + 20) $targetW $targetH 56.0
    $shadowBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(38, 0, 0, 0)
    [void]$g.FillPath($shadowBrush, $shadowPath)
    $shadowBrush.Dispose()

    # Tablet frame
    $borderPath = Get-RoundedPath ($targetX - 12) ($targetY - 12) ($targetW + 24) ($targetH + 24) 62.0
    $borderBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::FromArgb(255, 28, 36, 32)
    [void]$g.FillPath($borderBrush, $borderPath)
    $borderBrush.Dispose()

    # Clip & Draw
    $clipPath = Get-RoundedPath $targetX $targetY $targetW $targetH 50.0
    $state = $g.Save()
    [void]$g.SetClip($clipPath)
    [void]$g.DrawImage($srcImg, $targetX, $targetY, $targetW, $targetH)
    [void]$g.Restore($state)

    $srcImg.Dispose()
    $g.Dispose()

    $outiPad = "assets/screenshots/ios-ipad/$($item.OutputBase)-2048x2732.png"
    $bmp.Save($outiPad, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $outiPad"
}

Write-Host "SUCCESS: All iPhone 6.5 and iPad screenshots generated."
