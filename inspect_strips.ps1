Add-Type -AssemblyName System.Drawing

function Sample-Area($bmp, $xStart, $xEnd, $yStart, $yEnd) {
    $rSum = 0
    $gSum = 0
    $bSum = 0
    $count = 0
    for ($x = $xStart; $x -le $xEnd; $x += 2) {
        for ($y = $yStart; $y -le $yEnd; $y += 2) {
            $pixel = $bmp.GetPixel($x, $y)
            $rSum += $pixel.R
            $gSum += $pixel.G
            $bSum += $pixel.B
            $count++
        }
    }
    if ($count -eq 0) { return @(0,0,0, "#000000") }
    $r = [int][Math]::Round($rSum / $count)
    $g = [int][Math]::Round($gSum / $count)
    $b = [int][Math]::Round($bSum / $count)
    $hex = "#{0:X2}{1:X2}{2:X2}" -f $r, $g, $b
    return @($r, $g, $b, $hex)
}

Write-Host "=== UREA REFERENCE ==="
$bmpUrea = [System.Drawing.Bitmap]::FromFile((Resolve-Path "public/references/urea_reference.png"))
$leftUrea = Sample-Area $bmpUrea 260 320 660 760
Write-Host "Left Strip (Normal): RGB($($leftUrea[0]), $($leftUrea[1]), $($leftUrea[2])) Hex: $($leftUrea[3])"
$rightUrea = Sample-Area $bmpUrea 450 510 660 760
Write-Host "Right Strip (Adulterated): RGB($($rightUrea[0]), $($rightUrea[1]), $($rightUrea[2])) Hex: $($rightUrea[3])"
$bmpUrea.Dispose()

Write-Host "`n=== STARCH REFERENCE ==="
$bmpStarch = [System.Drawing.Bitmap]::FromFile((Resolve-Path "public/references/starch_reference.jpg"))
$leftStarch = Sample-Area $bmpStarch 140 190 620 720
Write-Host "Left Strip (Normal): RGB($($leftStarch[0]), $($leftStarch[1]), $($leftStarch[2])) Hex: $($leftStarch[3])"
$rightStarch = Sample-Area $bmpStarch 350 400 620 720
Write-Host "Right Strip (Adulterated): RGB($($rightStarch[0]), $($rightStarch[1]), $($rightStarch[2])) Hex: $($rightStarch[3])"
$bmpStarch.Dispose()

Write-Host "`n=== DETERGENT REFERENCE ==="
$bmpDet = [System.Drawing.Bitmap]::FromFile((Resolve-Path "public/references/detergent_reference.png"))
$leftDet = Sample-Area $bmpDet 260 320 630 720
Write-Host "Left Strip (Normal): RGB($($leftDet[0]), $($leftDet[1]), $($leftDet[2])) Hex: $($leftDet[3])"
$rightDet = Sample-Area $bmpDet 450 510 630 720
Write-Host "Right Strip (Adulterated): RGB($($rightDet[0]), $($rightDet[1]), $($rightDet[2])) Hex: $($rightDet[3])"
$bmpDet.Dispose()

Write-Host "`n=== DEFAULT AUTO SAMPLE POINT (width*0.5, height*0.75) ==="
foreach ($f in @('urea_reference.png', 'starch_reference.jpg', 'detergent_reference.png', 'formalin_reference.png')) {
    $bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path "public/references/$f"))
    $cx = [int]($bmp.Width * 0.5)
    $cy = [int]($bmp.Height * 0.75)
    if ($bmp.Width -gt $bmp.Height * 1.2) {
        $cx = [int]($bmp.Width * 0.25)
        $cy = [int]($bmp.Height * 0.5)
    }
    $p = $bmp.GetPixel($cx, $cy)
    $h = "#{0:X2}{1:X2}{2:X2}" -f [int]$p.R, [int]$p.G, [int]$p.B
    Write-Host "$f (W:$($bmp.Width) H:$($bmp.Height)) -> cx:$cx cy:$cy Hex:$h (R:$($p.R) G:$($p.G) B:$($p.B))"
    $bmp.Dispose()
}
