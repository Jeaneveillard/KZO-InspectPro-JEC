# Serveur HTTP statique avec compression gzip — KZO InspectPro
param([int]$Port = 8000)

Add-Type -AssemblyName System.IO.Compression

$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/ (gzip activé)"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".txt"  = "text/plain; charset=utf-8"
}

# Types compressibles (texte seulement — les binaires ne bénéficient pas de gzip)
$compressible = @('.html','.htm','.js','.css','.json','.svg','.txt')

function Compress-Gzip([byte[]]$data) {
    $ms  = New-Object System.IO.MemoryStream
    $gz  = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Compress)
    $gz.Write($data, 0, $data.Length)
    $gz.Close()
    return $ms.ToArray()
}

while ($listener.IsListening) {
    $ctx  = $listener.GetContext()
    $req  = $ctx.Request
    $resp = $ctx.Response

    $urlPath = $req.Url.AbsolutePath
    if ($urlPath -eq "/") { $urlPath = "/index.html" }

    $filePath = Join-Path $root ($urlPath.TrimStart("/").Replace("/", "\"))

    if (Test-Path $filePath -PathType Leaf) {
        $ext   = [System.IO.Path]::GetExtension($filePath).ToLower()
        $mime  = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)

        # Gzip si le client l'accepte et que le type est compressible
        $acceptGzip = $req.Headers["Accept-Encoding"] -match "gzip"
        if ($acceptGzip -and $compressible -contains $ext) {
            $bytes = Compress-Gzip $bytes
            $resp.Headers.Add("Content-Encoding", "gzip")
        }

        $resp.ContentType     = $mime
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $resp.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
        $resp.ContentType     = "text/plain"
        $resp.ContentLength64 = $msg.Length
        $resp.OutputStream.Write($msg, 0, $msg.Length)
    }
    $resp.OutputStream.Close()
}
