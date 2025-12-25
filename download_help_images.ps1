$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "public/images/help" | Out-Null

Write-Host "Downloading images..."

$images = @{
    "orig.jpg" = "http://fujimir.com.ua/images/orig.jpg"
    "crop.jpg" = "http://fujimir.com.ua/images/crop.jpg"
    "no_crop.jpg" = "http://fujimir.com.ua/images/no_crop.jpg"
    "frontier500.png" = "http://fujimir.com.ua/images/fontier500.png"
    "image-intelligence.jpg" = "http://fujimir.com.ua/images/image-intelligence.jpg"
    "crystalarhive.jpg" = "http://fujimir.com.ua/images/crystalarhive.jpg"
}

foreach ($name in $images.Keys) {
    try {
        $url = $images[$name]
        $output = "public/images/help/$name"
        Write-Host "Downloading $name from $url..."
        Invoke-WebRequest -Uri $url -OutFile $output
    } catch {
        Write-Warning "Failed to download $name. You may need to download it manually."
    }
}

Write-Host "Download complete."
