$fs = [System.IO.File]::OpenRead((Resolve-Path "public\models\nurali.glb"))
$br = New-Object System.IO.BinaryReader($fs)

$magic = $br.ReadUInt32()
$version = $br.ReadUInt32()
$length = $br.ReadUInt32()

$chunk0Length = $br.ReadUInt32()
$chunk0Type = $br.ReadUInt32() # 0x4E4F534A is 'JSON'

$jsonBytes = $br.ReadBytes($chunk0Length)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)

$fs.Close()

$gltf = $jsonStr | ConvertFrom-Json

Write-Host "GLTF Asset Generator:" $gltf.asset.generator
Write-Host "Number of Meshes:" $gltf.meshes.Count
Write-Host "Number of Nodes:" $gltf.nodes.Count
Write-Host "Number of Animations:" $gltf.animations.Count
Write-Host "Number of Skins:" $gltf.skins.Count

if ($gltf.animations) {
    Write-Host "Animations found:"
    foreach ($anim in $gltf.animations) {
        Write-Host " - " $anim.name
    }
}

if ($gltf.nodes) {
    Write-Host "Sample Nodes (first 15):"
    $count = [Math]::Min(15, $gltf.nodes.Count)
    for ($i = 0; $i -lt $count; $i++) {
        Write-Host " - Node $i:" $gltf.nodes[$i].name
    }
}
