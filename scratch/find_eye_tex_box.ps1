$filePath = 'c:\Users\rusta\.antigravity\dombyra-AI\public\models\cartoon_head.glb'
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $jsonLen)
$gltf = $jsonStr | ConvertFrom-Json

$binStart = 20 + $jsonLen + 8
$prim = $gltf.meshes[0].primitives[0]
$posAcc = $gltf.accessors[$prim.attributes.POSITION]
$uvAcc = $gltf.accessors[$prim.attributes.TEXCOORD_0]

$posBv = $gltf.bufferViews[$posAcc.bufferView]
$posOffset = $binStart + $posBv.byteOffset

$uvBv = $gltf.bufferViews[$uvAcc.bufferView]
$uvOffset = $binStart + $uvBv.byteOffset

# Texture is 4096 x 4096
# Let's find vertices where:
# Left eye in 3D: X between -0.12 and -0.04, Y between 0.35 and 0.45, Z between 0.15 and 0.25
$leftEyeUVs = @()
$rightEyeUVs = @()

for ($i = 0; $i -lt $posAcc.count; $i++) {
    $px = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12)
    $py = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 4)
    $pz = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 8)

    # Let's check left eye
    if ($px -ge -0.14 -and $px -le -0.03 -and $py -ge 0.33 -and $py -le 0.44 -and $pz -ge 0.18) {
        $u = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8)
        $v = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8 + 4)
        $leftEyeUVs += [PSCustomObject]@{ X=$px; Y=$py; Z=$pz; U=$u; V=$v; Px=[int]($u*4096); Py=[int]((1.0 - $v)*4096) }
    }

    # Let's check right eye
    if ($px -ge 0.03 -and $px -le 0.14 -and $py -ge 0.33 -and $py -le 0.44 -and $pz -ge 0.18) {
        $u = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8)
        $v = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8 + 4)
        $rightEyeUVs += [PSCustomObject]@{ X=$px; Y=$py; Z=$pz; U=$u; V=$v; Px=[int]($u*4096); Py=[int]((1.0 - $v)*4096) }
    }
}

Write-Output ("Left eye vertices: " + $leftEyeUVs.Count)
if ($leftEyeUVs.Count -gt 0) {
    $minPx = ($leftEyeUVs | Measure-Object -Property Px -Minimum).Minimum
    $maxPx = ($leftEyeUVs | Measure-Object -Property Px -Maximum).Maximum
    $minPy = ($leftEyeUVs | Measure-Object -Property Py -Minimum).Minimum
    $maxPy = ($leftEyeUVs | Measure-Object -Property Py -Maximum).Maximum
    Write-Output ("Left eye pixel box on 4096 texture: X = $minPx..$maxPx, Y = $minPy..$maxPy")
}

Write-Output ("Right eye vertices: " + $rightEyeUVs.Count)
if ($rightEyeUVs.Count -gt 0) {
    $minPx = ($rightEyeUVs | Measure-Object -Property Px -Minimum).Minimum
    $maxPx = ($rightEyeUVs | Measure-Object -Property Px -Maximum).Maximum
    $minPy = ($rightEyeUVs | Measure-Object -Property Py -Minimum).Minimum
    $maxPy = ($rightEyeUVs | Measure-Object -Property Py -Maximum).Maximum
    Write-Output ("Right eye pixel box on 4096 texture: X = $minPx..$maxPx, Y = $minPy..$maxPy")
}
