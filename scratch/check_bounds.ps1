$filePath = 'c:\Users\rusta\.antigravity\dombyra-AI\public\models\cartoon+head+3d+model.glb'
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $jsonLen)
$gltf = $jsonStr | ConvertFrom-Json

$accPos = $gltf.accessors[$gltf.meshes[0].primitives[0].attributes.POSITION]
Write-Output "POSITION Accessor:"
Write-Output ("  Min: " + ($accPos.min -join ', '))
Write-Output ("  Max: " + ($accPos.max -join ', '))
Write-Output ("  Count vertices: " + $accPos.count)

if ($null -ne $gltf.meshes[0].primitives[0].attributes.JOINTS_0) {
    Write-Output "Has JOINTS_0 (Skinned mesh!)"
}
