"""Buat ikon PNG PWA tanpa dependensi eksternal (PNG murni via zlib).

Ikon: latar gradient biru, huruf "W" putih sederhana + garis peta.
"""
import struct
import zlib
import pathlib
import math


def tulis_png(path, lebar, tinggi, pixel_fn, maskable=False):
    """pixel_fn(x, y) -> (r, g, b, a)"""
    baris = []
    for y in range(tinggi):
        baris.append(b"\x00")  # filter type 0
        for x in range(lebar):
            baris[-1] += bytes(pixel_fn(x, y))
    data = zlib.compress(b"".join(baris), 9)

    def chunk(tipe, isi):
        c = struct.pack(">I", len(isi)) + tipe + isi
        return c + struct.pack(">I", zlib.crc32(tipe + isi) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", lebar, tinggi, 8, 6, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", ihdr)
           + chunk(b"IDAT", data)
           + chunk(b"IEND", b""))
    pathlib.Path(path).write_bytes(png)
    return len(png)


def buat_ikon(ukuran, maskable=False):
    # gradient biru (sesuai theme_color #1d4ed8 -> #1e40af)
    c1 = (29, 78, 216)
    c2 = (30, 64, 175)
    putih = (255, 255, 255)

    # area aman maskable: 80% tengah
    margin = 0.10 if maskable else 0.0

    def pixel(x, y):
        # gradient diagonal
        t = (x + y) / (2 * ukuran)
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)

        # radius sudut (kecuali maskable, yang harus penuh)
        if not maskable:
            rad = ukuran * 0.22
            cx = min(max(x, rad), ukuran - rad)
            cy = min(max(y, rad), ukuran - rad)
            d = math.hypot(x - cx, y - cy)
            if d > rad:
                return (0, 0, 0, 0)

        # gambar "W" dari 4 garis tebal
        skala = ukuran * (1 - 2 * margin)
        ox = ukuran * margin
        oy = ukuran * margin

        def ke_px(fx, fy):
            return (ox + fx * skala, oy + fy * skala)

        titik = [ke_px(0.20, 0.32), ke_px(0.36, 0.70),
                 ke_px(0.50, 0.46), ke_px(0.64, 0.70),
                 ke_px(0.80, 0.32)]

        tebal = skala * 0.075

        for i in range(len(titik) - 1):
            ax, ay = titik[i]
            bx, by = titik[i + 1]
            # jarak titik ke segmen
            vx, vy = bx - ax, by - ay
            wx, wy = x - ax, y - ay
            panjang2 = vx * vx + vy * vy
            if panjang2 == 0:
                continue
            t2 = max(0.0, min(1.0, (wx * vx + wy * vy) / panjang2))
            px, py = ax + t2 * vx, ay + t2 * vy
            if math.hypot(x - px, y - py) <= tebal:
                return (putih[0], putih[1], putih[2], 255)

        return (r, g, b, 255)

    return pixel


def main():
    out = pathlib.Path("public/icons")
    out.mkdir(parents=True, exist_ok=True)

    for ukuran, nama in [(192, "icon-192.png"), (512, "icon-512.png")]:
        n = tulis_png(out / nama, ukuran, ukuran, buat_ikon(ukuran))
        print(f"{nama}: {n} byte")

    n = tulis_png(out / "icon-maskable-512.png", 512, 512, buat_ikon(512, maskable=True))
    print(f"icon-maskable-512.png: {n} byte")

    # apple touch icon 180
    n = tulis_png(out / "apple-touch-icon.png", 180, 180, buat_ikon(180))
    print(f"apple-touch-icon.png: {n} byte")

    # favicon 32
    n = tulis_png(out / "favicon-32.png", 32, 32, buat_ikon(32))
    print(f"favicon-32.png: {n} byte")


if __name__ == "__main__":
    main()
