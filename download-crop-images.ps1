# Run from the project root (folder with package.json):
#   powershell -ExecutionPolicy Bypass -File .\download-crop-images.ps1
# Saves images into public\crops\ so Vite serves them at /crops/<name>.jpg (works offline).
$ErrorActionPreference = 'Continue'
New-Item -ItemType Directory -Force -Path "public\crops" | Out-Null

$images = [ordered]@{
  'jasmine-rice'         = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMa-8htXoByJP6wU_3SG-hD1hLZnEy22ZrStWPmdk7-A&s=10'
  'red-apples'           = 'https://hips.hearstapps.com/hmg-prod/images/apples-royalty-free-image-1627315835.jpg?crop=0.668xw:1.00xh;0.187xw,0'
  'heirloom-tomatoes'    = 'https://honesttogoodness.com/wp-content/uploads/bb-plugin/cache/Heirloom-Tomatoes-landscape-cef4c7b73ac08a4af23d84d0eee7098b-.jpg'
  'organic-carrots'      = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpsDTxu9su5cYBK9TU8SkSlD-lFGQa-zGqcwQOEaSAcA&s=10'
  'russet-potatoes'      = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlqCiY4xFnjZY16FooVs7tf6L9wlOmGh_xVT8g40MOfrC8VXdSh-2HHv03dfYuIrpGxBrh-UoLraUJOtMs8v9Ag_TuZ9MYVcel2W8PsA&s=10'
  'crisp-lettuce-mix'    = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmV4_QEr472BkhNj7tsAZKyXY6mDvAq5OjqvaaG8uZPg&s'
  'hard-red-wheat'       = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT2hUD6xNd4eX0H_UaaWkOov4ni1EMj0jygoTbzQkJdDapqlgGLymz6pwH&s=10'
  'raw-wildflower-honey' = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuEa5Pr3DSWXS8aZgMYtaGpOC2WISoDN6s2p5NCULXVg&s=10'
  'summer-squash'        = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkfvoSrNj31ISCwMqKR7FuBC9-VCHoSv2AZYCgff3XjzQwsZQ98bRFjXaBg5VETcrMJxCoyr9pdx4FkvIb8KUZwNPlC_mbE9V-gN9Uhkg&s=10'
  'fresh-basil-bunches'  = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTp8Hxu8mLz5GbYRNSmm3ALYAit-p3A611SyeahLJ09sg&s=10'
  'sweet-corn'           = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStMs6XiQ05t1RVEPTNHCnk2uQpfvOUXyVSIYnYGLeVhurJpIPqhjQsrsg&s=10'
  'fresh-strawberries'   = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR35h52_-viy0eb4dm8BZ4x2W7nmyDks3pysjf_0MsYrw&s=10'
}

foreach ($name in $images.Keys) {
  $out = "public\crops\$name.jpg"
  try {
    Invoke-WebRequest -Uri $images[$name] -OutFile $out -UserAgent 'Mozilla/5.0' -UseBasicParsing
    Write-Host "ok   $name"
  } catch {
    Write-Host "FAIL $name  (save it manually as $out)"
  }
}
Write-Host "Done. Check public\crops\ for 12 files."