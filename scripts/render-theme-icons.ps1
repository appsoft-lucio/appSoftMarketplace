# Rebuild the original, Christmas and New Year PWA icons from editable SVGs.
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path $PSScriptRoot -Parent
foreach ($theme in 'original','christmas','new-year') {
  $target = Join-Path $projectRoot "apps/web/public/icons/$theme"
  New-Item -ItemType Directory -Force $target | Out-Null
  [xml]$svg = Get-Content (Join-Path $projectRoot "imagens/marketplace-icon-$theme.svg") -Encoding UTF8
  $bmp = New-Object System.Drawing.Bitmap 1024,1024
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.ScaleTransform(2,2)
  foreach ($s in $svg.DocumentElement.ChildNodes) {
    if ($s.Name -eq 'title') { continue }
    $brush = $null; $pen = $null
    if ($s.fill -and $s.fill -ne 'none') { $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($s.fill)) }
    if ($s.stroke) {
      $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($s.stroke)),([single]$s.'stroke-width')
      $pen.StartCap='Round'; $pen.EndCap='Round'; $pen.LineJoin='Round'
    }
    switch ($s.Name) {
      'rect' {
        $x=[single]$s.x; $y=[single]$s.y; $w=[single]$s.width; $h=[single]$s.height; $d=2*[single]$s.rx
        $p=New-Object System.Drawing.Drawing2D.GraphicsPath
        $p.AddArc($x,$y,$d,$d,180,90); $p.AddArc(($x+$w-$d),$y,$d,$d,270,90)
        $p.AddArc(($x+$w-$d),($y+$h-$d),$d,$d,0,90); $p.AddArc($x,($y+$h-$d),$d,$d,90,90); $p.CloseFigure()
        $g.FillPath($brush,$p); $p.Dispose()
      }
      'circle' { $r=[single]$s.r; $g.FillEllipse($brush,([single]$s.cx-$r),([single]$s.cy-$r),(2*$r),(2*$r)) }
      'line' { $g.DrawLine($pen,[single]$s.x1,[single]$s.y1,[single]$s.x2,[single]$s.y2) }
      { $_ -in 'polygon','polyline' } {
        [System.Drawing.PointF[]]$pts = @($s.points.Split(' ') | ForEach-Object { $xy=$_.Split(','); New-Object System.Drawing.PointF ([single]$xy[0]),([single]$xy[1]) })
        if ($s.Name -eq 'polygon') { $g.FillPolygon($brush,$pts) } else { $g.DrawLines($pen,$pts) }
      }
      default { throw "Unsupported SVG element: $($s.Name)" }
    }
    if ($brush) { $brush.Dispose() }; if ($pen) { $pen.Dispose() }
  }
  $g.Dispose()
  foreach ($size in 192,512) {
    $output=New-Object System.Drawing.Bitmap $size,$size
    $graphics=[System.Drawing.Graphics]::FromImage($output)
    $graphics.InterpolationMode='HighQualityBicubic'
    $graphics.DrawImage($bmp,0,0,$size,$size); $graphics.Dispose()
    $output.Save((Join-Path $target "icon-$size.png"),[System.Drawing.Imaging.ImageFormat]::Png)
    $output.Dispose()
  }
  $bmp.Dispose()
}
