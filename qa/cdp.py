"""Klien CDP minimal (stdlib) untuk audit UI webgisupdate."""
import json
import socket
import struct
import urllib.request

CDP_PORT = 9333


class WS:
    def __init__(self, url):
        _, _, hostport, path = url.split("/", 3)
        host, port = hostport.split(":")
        self.s = socket.create_connection((host, int(port)), timeout=60)
        key = "dGhlIHNhbXBsZSBub25jZQ=="
        req = (
            f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n"
            f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        )
        self.s.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self._id = 0

    def _frame(self, payload, opcode=1):
        data = payload.encode() if isinstance(payload, str) else payload
        b = bytearray([0x80 | opcode])
        n = len(data)
        if n < 126:
            b.append(0x80 | n)
        elif n < 65536:
            b.append(0x80 | 126)
            b += struct.pack(">H", n)
        else:
            b.append(0x80 | 127)
            b += struct.pack(">Q", n)
        mask = b"\x00\x00\x00\x00"  # masking tidak wajib untuk server lokal
        b += mask
        b += data
        return bytes(b)

    def send(self, method, **params):
        self._id += 1
        msg = json.dumps({"id": self._id, "method": method, "params": params})
        self.s.sendall(self._frame(msg))
        while True:
            resp = self._recv()
            if resp.get("id") == self._id:
                return resp

    def _recv(self):
        while True:
            hdr = self.s.recv(2)
            if not hdr:
                raise ConnectionError("socket closed")
            fin = hdr[0] & 0x80
            opcode = hdr[0] & 0x0F
            ln = hdr[1] & 0x7F
            if ln == 126:
                ln = struct.unpack(">H", self.s.recv(2))[0]
            elif ln == 127:
                ln = struct.unpack(">Q", self.s.recv(8))[0]
            data = b""
            while len(data) < ln:
                data += self.s.recv(ln - len(data))
            if opcode == 9:  # ping
                continue
            if opcode == 8:
                raise ConnectionError("closed")
            try:
                return json.loads(data.decode())
            except Exception:  # noqa: BLE001
                continue


def open_tab(url):
    js = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/list", timeout=20).read())
    page = next((t for t in js if t.get("type") == "page"), None)
    ws = WS(page["webSocketDebuggerUrl"])
    ws.send("Page.enable")
    ws.send("Runtime.enable")
    ws.send("Page.navigate", url=url)
    return ws


def evaluate(ws, expr, await_promise=False):
    r = ws.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=await_promise)
    return r.get("result", {}).get("result", {}).get("value")
