#!/usr/bin/env python3
"""Tiny local server for previewing the Medicare Skin & Hair Clinic website.

Run:  python3 server.py
Then open the printed URL in your browser. Press Ctrl+C to stop.
"""
import os
import http.server
import socketserver
from functools import partial

# Serve from this script's own folder, set explicitly so we never depend on the
# current working directory (some sandboxes block getcwd/chdir on iCloud paths).
ROOT = os.path.dirname(os.path.abspath(__file__))

PORT = 5050
Handler = partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"\n  Medicare Skin & Hair Clinic website")
    print(f"  →  http://localhost:{PORT}\n")
    print("  Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.\n")
