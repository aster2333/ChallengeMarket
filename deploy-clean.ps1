# Trae 部署前清理脚本
# 确保只上传必要的文件，避免文件数量超限

Write-Host "开始清理部署文件..." -ForegroundColor Green

# 1. 删除所有 node_modules 文件夹
Write-Host "删除 node_modules 文件夹..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force
    Write-Host "已删除根目录 node_modules" -ForegroundColor Green
}

# 删除嵌套的 node_modules
Get-ChildItem -Path . -Name "node_modules" -Recurse -Directory | ForEach-Object {
    $fullPath = Join-Path -Path (Get-Location) -ChildPath $_
    if (Test-Path $fullPath) {
        Remove-Item -Path $fullPath -Recurse -Force
        Write-Host "已删除: $_" -ForegroundColor Green
    }
}

# 2. 删除构建输出文件夹
$buildDirs = @("build", "dist", "dist-ssr", "out", ".next", ".nuxt", ".output")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        Write-Host "已删除构建目录: $dir" -ForegroundColor Green
    }
}

# 3. 删除缓存文件夹
$cacheDirs = @(".cache", ".parcel-cache", ".turbo", ".swc")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        Write-Host "已删除缓存目录: $dir" -ForegroundColor Green
    }
}

# 4. 删除日志文件
$logFiles = @("*.log", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*", "pnpm-debug.log*")
foreach ($pattern in $logFiles) {
    Get-ChildItem -Path . -Name $pattern -Recurse | ForEach-Object {
        Remove-Item -Path $_ -Force
        Write-Host "已删除日志文件: $_" -ForegroundColor Green
    }
}

# 5. 删除临时文件
$tempFiles = @("*.tmp", "*.temp")
foreach ($pattern in $tempFiles) {
    Get-ChildItem -Path . -Name $pattern -Recurse | ForEach-Object {
        Remove-Item -Path $_ -Force
        Write-Host "已删除临时文件: $_" -ForegroundColor Green
    }
}

# 6. 统计剩余文件数量
$fileCount = (Get-ChildItem -Path . -Recurse -File | Measure-Object).Count
$dirCount = (Get-ChildItem -Path . -Recurse -Directory | Measure-Object).Count

Write-Host "`n清理完成!" -ForegroundColor Green
Write-Host "剩余文件数量: $fileCount" -ForegroundColor Cyan
Write-Host "剩余文件夹数量: $dirCount" -ForegroundColor Cyan
Write-Host "总计: $($fileCount + $dirCount)" -ForegroundColor Cyan

if (($fileCount + $dirCount) -gt 4000) {
    Write-Host "`n警告: 文件数量仍然较多 ($($fileCount + $dirCount))，可能仍会遇到上传限制" -ForegroundColor Red
    Write-Host "建议检查是否还有其他大型文件夹需要忽略" -ForegroundColor Yellow
} else {
    Write-Host "`n文件数量合理，可以尝试重新部署" -ForegroundColor Green
}

Write-Host "`n请确保 .traeignore 文件已正确配置，然后重新尝试 Trae 部署" -ForegroundColor Cyan