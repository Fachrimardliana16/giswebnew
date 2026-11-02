"""Audit UI webgisupdate lewat CDP: layout, overflow, kontrol mati, konsol, performa."""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8123"


def nav(ws, path, wait=4.5):
    ws.send("Page.navigate", url=BASE + path)
    time.sleep(wait)


def measure(ws, label):
    print(f"\n===== {label} =====")
    info = evaluate(ws, r"""(() => {
      const d = document.documentElement;
      const out = {
        url: location.pathname,
        title: document.title,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: d.scrollWidth,
        overflowX: d.scrollWidth > window.innerWidth,
        bodyText: document.body ? document.body.innerText.slice(0, 120).replace(/\s+/g,' ') : '',
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        csrfFields: document.querySelectorAll('input[name="_token"]').length,
        h1: [...document.querySelectorAll('h1')].map(e=>e.innerText.trim()),
        imgNoAlt: [...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length,
        imgTotal: document.querySelectorAll('img').length,
        btnNoLabel: [...document.querySelectorAll('button')].filter(b=>!b.innerText.trim() && !b.getAttribute('aria-label')).length,
        externalScripts: [...document.querySelectorAll('script[src]')].map(s=>s.src),
        externalCss: [...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.href),
        hasVite: !!document.querySelector('link[href*="/build/assets/"]'),
        mapDiv: !!document.getElementById('map'),
        mapDivSize: (() => { const m=document.getElementById('map'); if(!m) return null; const r=m.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })(),
        leafletLoaded: typeof L !== 'undefined',
        jqueryLoaded: typeof $ !== 'undefined',
        toastContainer: !!document.getElementById('toast-container'),
      };
      return out;
    })()""")
    print(json.dumps(info, indent=2, ensure_ascii=False)[:2200])
    return info


def perf(ws):
    return evaluate(ws, r"""(() => {
      const n = performance.getEntriesByType('navigation')[0] || {};
      const paints = performance.getEntriesByType('paint').map(p=>({n:p.name,t:Math.round(p.startTime)}));
      const res = performance.getEntriesByType('resource').map(r=>({
        name: r.name.split('/').slice(0,5).join('/'), bytes: r.transferSize, ms: Math.round(r.duration), type: r.initiatorType
      })).sort((a,b)=>b.bytes-a.bytes).slice(0,12);
      return {ttfb: Math.round(n.responseStart||0), domContentLoaded: Math.round(n.domContentLoadedEventEnd||0),
              load: Math.round(n.loadEventEnd||0), paints, totalBytes: res.reduce((s,r)=>s+r.bytes,0), top: res};
    })()""")


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(3)
    measure(ws, "LOGIN (/login)")
    print("PERF:", json.dumps(perf(ws), indent=2)[:900])

    # login via form supaya dapat dashboard
    evaluate(ws, r"""(() => {
      document.querySelector('input[name=username]').value = 'fachri';
      document.querySelector('input[name=password]').value = 'password';
      document.querySelector('form').submit();
      return true;
    })()""")
    time.sleep(6)
    dash = measure(ws, "DASHBOARD (setelah login)")
    print("PERF:", json.dumps(perf(ws), indent=2)[:900])

    # cek interaksi: toggle section sidebar, profile dropdown, base map toggle
    inter = evaluate(ws, r"""(() => {
      const before = {sections: document.querySelectorAll('[id^="content-"]').length};
      const res = {};
      // toggleSection global?
      res.toggleSectionGlobal = typeof window.toggleSection === 'function';
      // klik section header pertama
      const hdr = document.querySelector('.sidebar-section-header');
      if (hdr) { hdr.click(); }
      const c = document.querySelector('[id^="content-"]');
      res.sectionHiddenAfterClick = c ? c.classList.contains('hidden') : 'no-content';
      // profile dropdown
      const pt = document.getElementById('profileToggle');
      const pd = document.getElementById('profileDropdown');
      if (pt && pd) { pt.click(); }
      res.dropdownOpen = pd ? !pd.classList.contains('hidden') : 'no-dropdown';
      // base map toggle
      const bm = document.getElementById('baseMapToggle');
      const bl = document.getElementById('baseMapLabel');
      res.baseMapLabelBefore = bl ? bl.textContent : null;
      if (bm) bm.click();
      res.baseMapLabelAfter = bl ? bl.textContent : null;
      // jumlah checkbox layer + yang tercheck
      res.layerCheckboxes = document.querySelectorAll('.layer-checkbox').length;
      res.checked = document.querySelectorAll('.layer-checkbox:checked').length;
      return res;
    })()""")
    print("\n===== INTERAKSI DASHBOARD =====")
    print(json.dumps(inter, indent=2, ensure_ascii=False))

    # konsol error
    errs = evaluate(ws, "window.__errs ? window.__errs : 'no-collector'")
    print("console collector:", errs)

    # admin pages
    nav(ws, "/settings/users")
    measure(ws, "ADMIN /settings/users")
    nav(ws, "/settings/roles")
    measure(ws, "ADMIN /settings/roles")

    # mobile viewport
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=844, deviceScaleFactor=2, mobile=True)
    nav(ws, "/dashboard", wait=5)
    mob = evaluate(ws, r"""(() => {
      const d = document.documentElement;
      const side = document.getElementById('sidebar');
      const sb = side ? side.getBoundingClientRect() : null;
      return {innerWidth: window.innerWidth, scrollWidth: d.scrollWidth, overflowX: d.scrollWidth > window.innerWidth,
        sidebarOffscreen: sb ? sb.left < 0 : null, sidebarWidth: sb ? Math.round(sb.width) : null,
        sidebarToggleVisible: (()=>{const t=document.getElementById('sidebarToggle');if(!t)return null;const r=t.getBoundingClientRect();return r.width>0&&r.left>=0;})(),
        headerHeight: (()=>{const h=document.querySelector('header');return h?Math.round(h.getBoundingClientRect().height):null;})(),
        mapHeight: (()=>{const m=document.getElementById('map');return m?Math.round(m.getBoundingClientRect().height):null;})(),
        footer: !!document.querySelector('footer')};
    })()""")
    print("\n===== MOBILE 390x844 =====")
    print(json.dumps(mob, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
