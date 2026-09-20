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

# Left Eye (viewer's left, X < 0)
$leftEyeUVs = @()
# Right Eye (viewer's right, X > 0)
$rightEyeUVs = @()

for ($i = 0; $i -lt $posAcc.count; $i++) {
    $px = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12)
    $py = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 4)
    $pz = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 8)

    # In screenshot: eyes are roughly X in [-0.15, -0.04], Y in [0.34, 0.44], Z in [0.20, 0.32]
    if ($px -ge -0.15 -and $px -le -0.04 -and $py -ge 0.34 -and $py -le 0.44 -and $pz -ge 0.20) {
        $u = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8)
        $v = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8 + 4)
        $leftEyeUVs += [PSCustomObject]@{ X=$px; Y=$py; Z=$pz; U=$u; V=$v }
    }

    if ($px -ge 0.04 -and $px -le 0.15 -and $py -ge 0.34 -and $py -le 0.44 -and $pz -ge 0.20) {
        $u = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8)
        $v = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8 + 4)
        $rightEyeUVs += [PSCustomObject]@{ X=$px; Y=$py; Z=$pz; U=$u; V=$v }
    }
}

Write-Output ("Left eye: " + $leftEyeUVs.Count + " vertices")
if ($leftEyeUVs.Count -gt 0) {
    $minU = ($leftEyeUVs | Measure-Object -Property U -Minimum).Minimum
    $maxU = ($leftEyeUVs | Measure-Object -Property U -Maximum).Maximum
    $minV = ($leftEyeUVs | Measure-Object -Property V -Minimum).Minimum
    $maxV = ($leftEyeUVs | Measure-Object -Property V -Maximum).Maximum
    Write-Output ("Left Eye UV bounds: U=[$minU, $maxU], V=[$minV, $maxV]")
}

Write-Output ("Right eye: " + $rightEyeUVs.Count + " vertices")
if ($rightEyeUVs.Count -gt 0) {
    $minU = ($rightEyeUVs | Measure-Object -Property U -Minimum).Minimum
    $maxU = ($rightEyeUVs | Measure-Object -Property U -Maximum).Maximum
    $minV = ($rightEyeUVs | Measure-Object -Property V -Minimum).Minimum
    $maxV = ($rightEyeUVs | Measure-Object -Property V -Maximum).Maximum
    Write-Output ("Right Eye UV bounds: U=[$minU, $maxU], V=[$minV, $maxV]")
}
