#!/usr/bin/env python3
"""
Simple HTTP server for AITuber Live System
Serves the HTML file with proper CORS headers
"""
import http.server
import socketserver
import os

PORT = 8001

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    # Change to the parent directory (AITuber folder) to serve all files
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(parent_dir)
    print(f"[*] サーバーディレクトリ: {os.getcwd()}")
    
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"[*] AITuber Live System サーバー起動")
        print(f"[*] URL: http://localhost:{PORT}/stitch_aituber_cyber_student_overlay/aituber_live_v2.html")
        print(f"[!] 終了するには Ctrl+C を押してください")
        print()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n[*] サーバーを停止しました")
