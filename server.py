# RUN: python server.py
# Open browser and go to http://localhost:8000/calculator/index.html

import http.server
import socketserver

class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        print(path)
        path = path.replace('/calculator', '')
        return super().translate_path(path)

PORT = 8000

with socketserver.TCPServer(("", PORT), MyRequestHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
