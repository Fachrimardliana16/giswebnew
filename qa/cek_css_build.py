"""Pastikan CSS hasil build memuat aturan perbaikan saran."""
import glob

f = sorted(glob.glob("public/build/assets/app-*.css"))[-1]
s = open(f, encoding="utf-8", errors="replace").read()
rapat = s.replace(" ", "")

print("file:", f, f"({len(s)} byte)")
for pola in ["overflow:visible", "#mobileSuggest", "top:calc(100%+6px)",
             "max-height:min(52vh,330px)", "z-index:95"]:
    print(f"  {pola:30} -> {'ADA' if pola.replace(' ', '') in rapat else 'TIDAK'}")
