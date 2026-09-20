$filePath = 'c:\Users\rusta\.antigravity\dombyra-AI\public\models\cartoon_head.glb'
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $jsonLen)
$gltf = $jsonStr | ConvertFrom-Json

$head = $gltf.nodes | Where-Object { $_.name -eq 'head' }
$neck = $gltf.nodes | Where-Object { $_.name -eq 'neck_01' }

Write-Output "Head node:"
$head | ConvertTo-Json
Write-Output "Neck node:"
$neck | ConvertTo-Json
