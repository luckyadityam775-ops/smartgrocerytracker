param([int]$port = 8080)

$baseDir = $PSScriptRoot
$dataDir = Join-Path $baseDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}
$dbUsersFile = Join-Path $dataDir "users.json"
if (-not (Test-Path $dbUsersFile)) {
    $initialUsers = @(
        @{ id = "user_rian"; name = "Rian"; fullName = "Rian (Anak Rantau)"; email = "rian@kost.id"; password = "123"; role = "Siswa Rantau"; avatarBg = "bg-emerald-600"; avatarLetter = "R" },
        @{ id = "user_aditya"; name = "Aditya"; fullName = "Aditya (Mahasiswa)"; email = "aditya@kampus.id"; password = "123"; role = "Mahasiswa"; avatarBg = "bg-indigo-600"; avatarLetter = "A" }
    )
    $initialUsers | ConvertTo-Json -Depth 5 | Set-Content $dbUsersFile -Encoding UTF8
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()
Write-Host "TCP Web Server started on port $port with Database API support (all hosts accepted)"

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

        $headers = @{}
        $contentLength = 0
        while (($header = $reader.ReadLine()) -and ($header -ne "")) {
            $hParts = $header.Split(":", 2)
            if ($hParts.Length -eq 2) {
                $headers[$hParts[0].Trim().ToLower()] = $hParts[1].Trim()
            }
        }
        if ($headers.ContainsKey("content-length")) {
            [int]::TryParse($headers["content-length"], [ref]$contentLength) | Out-Null
        }

        $parts = $requestLine.Split(" ")
        $method = $parts[0].ToUpper()
        $rawPath = if ($parts.Length -gt 1) { $parts[1].TrimStart('/') } else { "index.html" }
        if ([string]::IsNullOrWhiteSpace($rawPath) -or $rawPath -eq "") {
            $rawPath = "index.html"
        }
        $rawPath = $rawPath.Split('?')[0]

        # Handle CORS Preflight
        if ($method -eq "OPTIONS") {
            $headerText = "HTTP/1.1 204 No Content`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`r`nAccess-Control-Allow-Headers: Content-Type`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerText)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Flush()
            $client.Close()
            continue
        }

        # ----------------- DATABASE API ENDPOINT: /api/users -----------------
        if ($rawPath -eq "api/users" -or $rawPath -eq "api/users/") {
            if ($method -eq "GET") {
                $content = if (Test-Path $dbUsersFile) { [System.IO.File]::ReadAllText($dbUsersFile, [System.Text.Encoding]::UTF8) } else { "[]" }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                $headerText = "HTTP/1.1 200 OK`r`nContent-Type: application/json; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerText)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($bytes, 0, $bytes.Length)
                $stream.Flush()
                $client.Close()
                continue
            }
            elseif ($method -eq "POST") {
                $bodyChars = New-Object char[] $contentLength
                $readCount = 0
                while ($readCount -lt $contentLength) {
                    $r = $reader.Read($bodyChars, $readCount, $contentLength - $readCount)
                    if ($r -le 0) { break }
                    $readCount += $r
                }
                $bodyString = [string]::new($bodyChars, 0, $readCount)

                try {
                    $newUser = $bodyString | ConvertFrom-Json
                    $existingRaw = if (Test-Path $dbUsersFile) { [System.IO.File]::ReadAllText($dbUsersFile, [System.Text.Encoding]::UTF8) } else { "[]" }
                    $existingList = $existingRaw | ConvertFrom-Json
                    if (-not ($existingList -is [System.Collections.IList] -or $existingList -is [System.Array])) {
                        $existingList = @($existingList)
                    }

                    # Filter out duplicate by email
                    $updatedList = @($existingList | Where-Object { $_.email -ne $newUser.email })
                    $updatedList += $newUser
                    $updatedJson = $updatedList | ConvertTo-Json -Depth 5
                    [System.IO.File]::WriteAllText($dbUsersFile, $updatedJson, [System.Text.Encoding]::UTF8)

                    $respJson = @{ success = $true; user = $newUser } | ConvertTo-Json
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                    $headerText = "HTTP/1.1 200 OK`r`nContent-Type: application/json; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerText)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($bytes, 0, $bytes.Length)
                } catch {
                    $errText = "HTTP/1.1 400 Bad Request`r`nContent-Type: application/json`r`nContent-Length: 26`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n{`"error`":`"Invalid JSON`"}"
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errText)
                    $stream.Write($errBytes, 0, $errBytes.Length)
                }
                $stream.Flush()
                $client.Close()
                continue
            }
        }

        # ----------------- STATIC FILE SERVING -----------------
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
            $errText = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: 9`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`nNot Found"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errText)
            $stream.Write($errBytes, 0, $errBytes.Length)
        }
        $stream.Flush()
        $client.Close()
    } catch {
        # ignore client disconnect
    }
}
