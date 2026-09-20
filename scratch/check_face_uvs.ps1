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

# Let's find vertices where Y is between 0.30 and 0.45 and Z > 0.05 (the face/eyes region!)
$faceVerts = @()
for ($i = 0; $i -lt $posAcc.count; $i++) {
    $px = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12)
    $py = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 4)
    $pz = [System.BitConverter]::ToSingle($bytes, $posOffset + $i * 12 + 8)

    if ($py -ge 0.30 -and $py -le 0.45 -and $pz -ge 0.05) {
        $u = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8)
        $v = [System.BitConverter]::ToSingle($bytes, $uvOffset + $i * 8 + 4)
        $faceVerts += [PSCustomObject]@{ Idx = $i; X = $px; Y = $py; Z = $pz; U = $u; V = $v }
    }
}

Write-Output ("Face vertices found: " + $faceVerts.Count)
# Sample 10 vertices
$faceVerts[0..9] | Format-Table -AutoSize
