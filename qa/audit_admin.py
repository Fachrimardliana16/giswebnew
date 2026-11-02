"""Uji halaman admin: modal, edit, bulk select, delete (semua lewat data-attr)."""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"


def wait_until(ws, expr, timeout=25):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if evaluate(ws, expr):
                return True
        except Exception:
            pass
        time.sleep(0.7)
    return False


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(4)
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit();
      return true;
    })()""")
    wait_until(ws, "location.pathname === '/dashboard'")

    # cegah form benar-benar submit saat uji (kita hanya uji UI, bukan data)
    BLOCK = """(() => {
      window.__submitted = [];
      document.addEventListener('submit', e => {
        window.__submitted.push(e.target.id || e.target.action || 'anon');
        e.preventDefault();
      }, true);
      window.confirm = () => true;
      return true;
    })()"""

    hasil = {}

    # ---------- USERS ----------
    ws.send("Page.navigate", url=BASE + "/settings/users")
    time.sleep(4)
    evaluate(ws, BLOCK)

    hasil["users: buka modal tambah"] = evaluate(ws, """(() => {
      const b = document.querySelector('[data-modal-open="addUserModal"]');
      if (!b) return {error: 'tombol tidak ada'};
      b.click();
      const m = document.getElementById('addUserModal');
      return {terbuka: m && !m.classList.contains('hidden')};
    })()""")

    hasil["users: tutup modal tambah"] = evaluate(ws, """(() => {
      const b = document.querySelector('[data-modal-close="addUserModal"]');
      if (!b) return {error: 'tombol tutup tidak ada'};
      b.click();
      const m = document.getElementById('addUserModal');
      return {tertutup: m && m.classList.contains('hidden')};
    })()""")

    hasil["users: edit membuka modal + isi form"] = evaluate(ws, """(() => {
      const b = document.querySelector('[data-user-edit]');
      if (!b) return {error: 'tombol edit tidak ada'};
      const data = JSON.parse(b.dataset.userEdit);
      b.click();
      const m = document.getElementById('editUserModal');
      const form = document.getElementById('editUserForm');
      return {
        terbuka: m && !m.classList.contains('hidden'),
        username_terisi: document.getElementById('edit_username').value === data.username,
        role_terisi: String(document.getElementById('edit_role_id').value) === String(data.role_id),
        action: form ? form.getAttribute('action') : null,
        action_benar: form ? form.getAttribute('action').endsWith('/' + data.id) : false,
      };
    })()""")

    hasil["users: select all + tombol bulk muncul"] = evaluate(ws, """(() => {
      const cb = document.getElementById('selectAll');
      cb.checked = true;
      cb.dispatchEvent(new Event('change', {bubbles: true}));
      const tercentang = document.querySelectorAll('.user-checkbox:checked').length;
      const total = document.querySelectorAll('.user-checkbox').length;
      const btn = document.getElementById('bulkDeleteBtn');
      const tampil = btn && !btn.classList.contains('hidden');
      const count = document.getElementById('selectedCount').textContent;
      return {tercentang, total, tombol_bulk_tampil: tampil, counter: count};
    })()""")

    hasil["users: hapus massal mengisi form"] = evaluate(ws, """(() => {
      const b = document.querySelector('[data-bulk-delete]');
      b.click();
      const form = document.getElementById('bulkDeleteForm');
      const ids = form.querySelectorAll('input[name="ids[]"]').length;
      const submitted = (window.__submitted || []).includes('bulkDeleteForm');
      return {ids_terkirim: ids, form_disubmit: submitted};
    })()""")

    # ---------- ROLES ----------
    ws.send("Page.navigate", url=BASE + "/settings/roles")
    time.sleep(4)
    evaluate(ws, BLOCK)

    hasil["roles: buka + tutup modal tambah"] = evaluate(ws, """(() => {
      const o = document.querySelector('[data-modal-open="addRoleModal"]');
      const m = document.getElementById('addRoleModal');
      o.click();
      const terbuka = !m.classList.contains('hidden');
      document.querySelector('[data-modal-close="addRoleModal"]').click();
      return {terbuka, tertutup: m.classList.contains('hidden')};
    })()""")

    hasil["roles: edit mengisi permission"] = evaluate(ws, """(() => {
      // cari role yang punya permissions
      const all = [...document.querySelectorAll('[data-role-edit]')];
      let target = null, data = null;
      for (const b of all) {
        const d = JSON.parse(b.dataset.roleEdit);
        if (Array.isArray(d.permissions) && d.permissions.length) { target = b; data = d; break; }
      }
      if (!target) return {catatan: 'tidak ada role dengan permissions', jumlah_role: all.length};
      target.click();
      const m = document.getElementById('editRoleModal');
      const tercentang = [...document.querySelectorAll('#edit_permissions_container input:checked')]
                            .map(c => c.value);
      return {
        role: data.name,
        expected: data.permissions,
        terbuka: !m.classList.contains('hidden'),
        tercentang,
        cocok: JSON.stringify(tercentang.sort()) === JSON.stringify([...data.permissions].sort()),
      };
    })()""")

    hasil["roles: select all + bulk"] = evaluate(ws, """(() => {
      const cb = document.getElementById('selectAll');
      cb.checked = true;
      cb.dispatchEvent(new Event('change', {bubbles: true}));
      const tercentang = document.querySelectorAll('.role-checkbox:checked').length;
      const total = document.querySelectorAll('.role-checkbox').length;
      const btn = document.getElementById('bulkDeleteBtn');
      return {tercentang, total, tombol_bulk_tampil: btn && !btn.classList.contains('hidden')};
    })()""")

    print(json.dumps(hasil, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
