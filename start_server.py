import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print(f" EVA ELEKTROMEKANIK 3D WEB PLATFORMU BASLATILDI")
        print(f" URL: {url}")
        print(" Tarayiciniz otomatik olarak aciliyor...")
        print(" Durdurmak icin Ctrl + C tuslarina basiniz.")
        print("=" * 60)
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nSunucu kapatildi.")

if __name__ == "__main__":
    run()
