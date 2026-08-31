$src = 'C:\code\tauri-pp\dsh-prompt-customizer'
$dst = 'C:\Users\dream\.dsh\profiles\web\node_modules\dsh-prompt-customizer'

# 先构建客户端：client.js 是 tsdown 产物，改过 src/ 不 build 就会复制旧产物。
Push-Location $src
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'npm run build 失败，已中止复制' }
Pop-Location

# 整目录拷贝：按文件名逐条列会漏掉新增的 lib 文件（catalog.js 就是这么被漏掉的）。
New-Item -ItemType Directory -Force -Path "$dst\client" | Out-Null
New-Item -ItemType Directory -Force -Path "$dst\lib" | Out-Null
Copy-Item "$src\client\client.js" "$dst\client\client.js" -Force
Copy-Item "$src\lib\*" "$dst\lib\" -Force
Write-Host "Done"
