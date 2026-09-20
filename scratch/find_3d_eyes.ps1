$filePath = 'c:\Users\rusta\.antigravity\dombyra-AI\public\models\cartoon_head.glb'
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $jsonLen)
$gltf = $jsonStr | ConvertFrom-Json

$binStart = 20 + $jsonLen + 8

# Let's inspect accessors for POSITION and TEXCOORD_0
$prim = $gltf.meshes[0].primitives[0]
$posAcc = $gltf.accessors[$prim.attributes.POSITION]
$uvAcc = $gltf.accessors[$prim.attributes.TEXCOORD_0]

Write-Output ("Positions count: " + $posAcc.count)
Write-Output ("UV count: " + $uvAcc.count)

# Read pos buffer
$posBv = $gltf.bufferViews[$posAcc.bufferView]
$posOffset = $binStart + $posBv.byteOffset

# Read uv buffer
$uvBv = $gltf.bufferViews[$uvAcc.bufferView]
$uvOffset = $binStart + $uvBv.byteOffset

# Let's find vertices where UV is near the eye texture island:
# In the texture, the eye island was near top center: u ~ 0.50..0.55, v ~ 0.01..0.08 (remember glTF v is 1 - y)
Write-Output "Scanning vertices for eye UVs..."

$eyeVerts = @()
for ($i = 0; $i -lt $uvAcc.count; $i++) {
    $u = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8)
    $v = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8 + 4)

    # Let's check u around 0.45..0.6, v around 0.90..0.99 (or 0.01..0.1)
    if (($u -ge 0.45 -and $u -le 0.60) -and (($v -ge 0.90 -and $v -le 1.0) -or ($v -ge 0.0 -and $v -le 0.10))) {
        $px = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12)
        $py = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 4)
        $pz = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 8)
        $eyeVerts += [PSCustomObject]@{ Idx = $i; U = $u; V = $v; X = $px; Y = $py; Z = $pz }
    }
}

Write-Output ("Found matching eye vertices: " + $eyeVerts.Count)
if ($eyeVerts.Count -gt 0) {
    $leftEye = $eyeVerts | Where-Object { $_.X -lt 0 }
    $rightEye = $eyeVerts | Where-Object { $_.X -gt 0 }
    Write-Output ("Left eye candidate vertices: " + $leftEye.Count)
    if ($leftEye.Count -gt 0) {
        $avgLx = ($leftEye | Measure-Object -Property X -Average).Average
        $avgLy = ($leftEye | Measure-Object -Property Y -Average).Average
        $avgLz = ($leftEye | Measure-Object -Property Z -Average).Average
        Write-Output ("Left eye center: X=$avgLx, Y=$avgLy, Z=$avgLz")
    }
    Write-Output ("Right eye candidate vertices: " + $rightEye.Count)
    if ($rightEye.Count -gt 0) {
        $avgRx = ($rightEye | Measure-Object -Property X -Average).Average
        $avgRy = ($rightEye | Measure-Object -Property Y -Average).Average
        $avgRz = ($rightEye | Measure-Object -Property Z -Average).Average
        Write-Output ("Right eye center: X=$avgRx, Y=$avgRy, Z=$avgRz")
    }
}
