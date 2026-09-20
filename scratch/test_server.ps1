$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:3005/")
try {
    $listener.Start()
    Write-Output "HTTP Server can listen on port 3005!"
    $listener.Stop()
} catch {
    Write-Output ("Error: " + $_.Exception.Message)
}
