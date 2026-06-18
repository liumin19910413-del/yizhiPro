#!/bin/bash

echo "🚀 启动店商供应链测试服务器..."
echo ""
echo "📦 MG管理后台: http://localhost:8000/mg/index.html"
echo "📱 Lite商户后台: http://localhost:8000/lite/index.html"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000
