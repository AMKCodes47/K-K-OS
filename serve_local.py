"""Start a local preview server for K&K OS and open it in the default browser."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser

ROOT = Path(__file__).resolve().parent
URL = "http://127.0.0.1:8000/"

if __name__ == "__main__":
    import os
    os.chdir(ROOT)
    try:
        server = ThreadingHTTPServer(("127.0.0.1", 8000), SimpleHTTPRequestHandler)
    except OSError as exc:
        print(f"Could not start K&K OS preview on port 8000: {exc}")
        print("Close any other preview server using port 8000 and try again.")
        input("Press Enter to close...")
        raise SystemExit(1)
    print("K&K OS local preview:", URL)
    print("Keep this terminal open while editing. Press Ctrl+C to stop the server.")
    Timer(0.7, lambda: webbrowser.open(URL)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nK&K OS preview stopped.")
    finally:
        server.server_close()
