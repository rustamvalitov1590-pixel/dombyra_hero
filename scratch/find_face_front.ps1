$filePath = 'c:\Users\rusta\.antigravity\dombyra-AI\public\models\cartoon_head.glb'
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $jsonLen)
$gltf = $jsonStr | ConvertFrom-Json

$binStart = 20 + $jsonLen + 8
$prim = $gltf.meshes[0].primitives[0]
$posAcc = $gltf.accessors[$prim.attributes.POSITION]
$posBv = $gltf.bufferViews[$posAcc.bufferView]
$posOffset = $binStart + $posBv.byteOffset

# Look at the screenshot:
# The face is centered around X=0
# Left eye (viewer's left, character's right) is at X < 0, roughly X around -0.07..-0.15, Y around 0.55..0.70!
# Let's inspect vertices with Z > 0.15 (front of face)
$frontVerts = @()
for ($i = 0; $i -lt $posAcc.count; $i++) {
    $px = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12)
    $py = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 4)
    $pz = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 8)

    if ($pz -gt 0.20) {
        $frontVerts += [PSCustomObject]@{ Idx = $i; X = $px; Y = $py; Z = $pz }
    }
}

Write-Output ("Vertices with Z > 0.20: " + $frontVerts.Count)
$minY = ($frontVerts | Measure-Object -Property Y -Minimum).Minimum
$maxY = ($frontVerts | Measure-Object -Property Y -Maximum).Maximum
Write-Output ("Y range in front of face: $minY to $maxY")

$minX = ($frontVerts | Measure-Object -Property X -Minimum).Minimum
$maxX = ($frontVerts | Measure-Object -Property X -Maximum).Maximum
Write-Output ("X range in front of face: $minX to $maxX")
