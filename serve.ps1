# serve.ps1 - 启动一个简单的 Python HTTP 服务器

# 获取脚本所在的目录
$scriptPath = $PSScriptRoot

# 切换到脚本所在的目录
cd $scriptPath

# 定义服务器参数
$hostAddress = "0.0.0.0"
$port = 8000

# 获取本机在局域网中的 IP 地址（可能需要用户手动确认哪个是正确的）
Write-Host "Getting local IP addresses..."
try {
    $ipEntries = Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred | Where-Object { $_.IPAddress -ne '127.0.0.1' }
    if ($ipEntries) {
        Write-Host "Your computer might be accessible on the local network via these IPs:"
        $ipEntries | ForEach-Object { Write-Host "  http://"$_.IPAddress":$port" }
    } else {
        Write-Host "Could not automatically determine a local network IP address. You might need to find it manually (e.g., using 'ipconfig')."
    }
} catch {
    Write-Host "Error getting IP address automatically. You might need to find it manually (e.g., using 'ipconfig')."
}


# 提示信息
Write-Host "`nStarting Python HTTP server on $hostAddress`:$port"
Write-Host "Serving files from '$scriptPath'"
Write-Host "Open the URL(s) above in your phone's browser (ensure phone is on the same Wi-Fi network)."
Write-Host "Press CTRL+C in this terminal to stop the server."
Write-Host "-----------------------------------------------------"

# 启动 Python HTTP 服务器
# 注意: 需要确保 python 在你的系统 PATH 环境变量中
python -m http.server $port --bind $hostAddress

# 服务器会在后台运行，直到你按 Ctrl+C 