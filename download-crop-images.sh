#!/usr/bin/env bash
# Run from the project root (the folder containing package.json):  bash download-crop-images.sh
# Saves images into public/crops/ so Vite serves them at /crops/<name>.jpg (works offline).
mkdir -p public/crops && cd public/crops || exit 1
get(){ curl -L --fail -sS -A "Mozilla/5.0" -o "$1.jpg" "$2" && echo "ok   $1" || echo "FAIL $1 (save it manually as public/crops/$1.jpg)"; }
get jasmine-rice        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMa-8htXoByJP6wU_3SG-hD1hLZnEy22ZrStWPmdk7-A&s=10'
get red-apples          'https://hips.hearstapps.com/hmg-prod/images/apples-royalty-free-image-1627315835.jpg?crop=0.668xw:1.00xh;0.187xw,0'
get heirloom-tomatoes   'https://honesttogoodness.com/wp-content/uploads/bb-plugin/cache/Heirloom-Tomatoes-landscape-cef4c7b73ac08a4af23d84d0eee7098b-.jpg'
get organic-carrots     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpsDTxu9su5cYBK9TU8SkSlD-lFGQa-zGqcwQOEaSAcA&s=10'
get russet-potatoes     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlqCiY4xFnjZY16FooVs7tf6L9wlOmGh_xVT8g40MOfrC8VXdSh-2HHv03dfYuIrpGxBrh-UoLraUJOtMs8v9Ag_TuZ9MYVcel2W8PsA&s=10'
get crisp-lettuce-mix   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmV4_QEr472BkhNj7tsAZKyXY6mDvAq5OjqvaaG8uZPg&s'
get hard-red-wheat      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT2hUD6xNd4eX0H_UaaWkOov4ni1EMj0jygoTbzQkJdDapqlgGLymz6pwH&s=10'
get raw-wildflower-honey 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuEa5Pr3DSWXS8aZgMYtaGpOC2WISoDN6s2p5NCULXVg&s=10'
get summer-squash       'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkfvoSrNj31ISCwMqKR7FuBC9-VCHoSv2AZYCgff3XjzQwsZQ98bRFjXaBg5VETcrMJxCoyr9pdx4FkvIb8KUZwNPlC_mbE9V-gN9Uhkg&s=10'
get fresh-basil-bunches 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTp8Hxu8mLz5GbYRNSmm3ALYAit-p3A611SyeahLJ09sg&s=10'
echo "Still needed (no URL given): sweet-corn.jpg and fresh-strawberries.jpg -> put them in public/crops/"
