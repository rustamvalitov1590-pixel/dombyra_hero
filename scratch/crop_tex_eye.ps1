Add-Type -AssemblyName System.Drawing

$tex = [System.Drawing.Bitmap]::FromFile('c:\Users\rusta\.antigravity\dombyra-AI\public\images\extracted_model_tex_0.jpg')
Write-Output ("Texture size: " + $tex.Width + "x" + $tex.Height)

# Let's inspect the top area (y=0..200, x=900..1200) where the eye was spotted
# Let's crop a box around y=0..250, x=950..1250
$crop = New-Object System.Drawing.Bitmap 300, 250
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.DrawImage($tex, (New-Object System.Drawing.Rectangle 0, 0, 300, 250), 950, 0, 300, 250, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$crop.Save('c:\Users\rusta\.antigravity\dombyra-AI\public\images\test_tex_crop.png', [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$tex.Dispose()

Write-Output "Saved test_tex_crop.png"
