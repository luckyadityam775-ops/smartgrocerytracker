param([int]$port = 8080)

$baseDir = $PSScriptRoot
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()
Write-Host "TCP Web Server started on port $port (all hosts accepted)"

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)

        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        # Read remaining headers
        while (($header = $reader.ReadLine()) -and ($header -ne "")) {}

        $parts = $requestLine.Split(" ")
        $rawPath = if ($parts.Length -gt 1) { $parts[1].TrimStart('/') } else { "index.html" }
        if ([string]::IsNullOrWhiteSpace($rawPath) -or $rawPath -eq "") {
            $rawPath = "index.html"
        }
        # Strip query string
        $rawPath = $rawPath.Split('?')[0]

        $filePath = Join-Path $baseDir $rawPath
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                default { "application/octet-stream" }
            }

            $headerText = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerText)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $errText = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: 9`r`nConnection: close`r`n`r`nNot Found"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errText)
            $stream.Write($errBytes, 0, $errBytes.Length)
        }
        $stream.Flush()
        $client.Close()
    } catch {
        # ignore client disconnect
    }
}
