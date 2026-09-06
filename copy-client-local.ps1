$src = 'C:\Users\dream\dsh-pulgn\dsh-prompt-customizer'
$dst = 'C:\Users\dream\.dsh\profiles\web\node_modules\dsh-prompt-customizer'

# 先构建客户端：client.js 是 tsdown 产物，改过 src/ 不 build 就会复制旧产物。
Push-Location $src
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'npm run build 失败，已中止复制' }
Pop-Location

# 整目录拷贝：按文件名逐条列会漏掉新增的 lib 文件（catalog.js 就是这么被漏掉的）。
# 注意 -Recurse 必须带上：Copy-Item 的通配拷贝不递归子目录，lib 下的新增子目录
#（如 lib\zh 中文段译本）只会漏掉 / 复制成空壳，启动时 import 直接失败。
New-Item -ItemType Directory -Force -Path "$dst\client" | Out-Null
New-Item -ItemType Directory -Force -Path "$dst\lib" | Out-Null
Copy-Item "$src\client\client.js" "$dst\client\client.js" -Force
Copy-Item "$src\lib\*" "$dst\lib\" -Recurse -Force
# package.json 也要同步：宿主从它读 dsh.client.inject（客户端 bundle 的模块
# 加载图）与版本号，不同步会让已安装副本一直跑旧的 inject 声明。
# cordis.patch.yml 同理（bundle roster 的 patch 入口指向它）。
# 运行中的 DSH 会锁住 package.json，Copy-Item 原地覆盖会失败 —— 先删再拷
# （POSIX unlink 语义绕开共享锁），复制后比对版本号，不一致就报错中止。
Remove-Item "$dst\package.json" -Force -ErrorAction SilentlyContinue
Remove-Item "$dst\cordis.patch.yml" -Force -ErrorAction SilentlyContinue
Copy-Item "$src\package.json" "$dst\package.json" -Force
Copy-Item "$src\cordis.patch.yml" "$dst\cordis.patch.yml" -Force
$srcVer = (Get-Content "$src\package.json" -Raw | ConvertFrom-Json).version
$dstVer = (Get-Content "$dst\package.json" -Raw | ConvertFrom-Json).version
if ($srcVer -ne $dstVer) {
  throw "package.json 同步失败（目标仍为 $dstVer，源为 $srcVer）——文件可能被运行中的 DSH 占用，关闭后重试"
}
Write-Host "Done"
