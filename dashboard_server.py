"""Servidor Flask local para o Dashboard de Ouvidorias."""
import os
import json
import time
import threading

_BASE         = os.path.dirname(os.path.abspath(__file__))
DASHBOARD_DIR = os.path.join(_BASE, 'dashboard')
CONFIG_FILE   = os.path.join(_BASE, 'config.json')
PORT          = 7731

try:
    from flask import Flask, jsonify, request, send_from_directory
    FLASK_OK = True
except ImportError:
    FLASK_OK = False

if FLASK_OK:
    app = Flask(__name__)

    # ── helpers ────────────────────────────────────────────────────────────────
    def _cfg():
        try:
            with open(CONFIG_FILE, encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}

    def _excel():
        cfg = _cfg()
        pasta = cfg.get('pasta_base', 'ouvidorias')
        return os.path.join(_BASE, pasta, 'ouvidorias.xlsx')

    # ── CORS ───────────────────────────────────────────────────────────────────
    @app.after_request
    def _cors(r):
        r.headers.update({
            'Access-Control-Allow-Origin':  '*',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        })
        return r

    # ── static ─────────────────────────────────────────────────────────────────
    _JSX_FILES = ['data.jsx', 'mapa-unidades.jsx', 'split-triagem.jsx', 'command-center.jsx']

    _HTML_TEMPLATE = '''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Ouvidoria · Dashboard</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    html, body, #root {{ width: 100%; height: 100%; overflow: hidden; background: oklch(0.18 0.006 260); }}
    body {{ font-family: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif; }}
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
</head>
<body>
  <div id="root"></div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" data-presets="react">
{jsx_bundle}

function App() {{
  React.useEffect(() => {{
    if (typeof window._OUV_FETCH === 'function') window._OUV_FETCH();
    const id = setInterval(() => {{
      if (typeof window._OUV_FETCH === 'function') window._OUV_FETCH();
    }}, 60000);
    return () => clearInterval(id);
  }}, []);
  return (
    <div style={{{{ width:'100vw', height:'100vh', display:'flex', overflow:'hidden' }}}}>
      <CommandCenter standalone />
    </div>
  );
}}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
  </script>
</body>
</html>'''

    @app.route('/')
    def index():
        from flask import Response
        parts = []
        for fname in _JSX_FILES:
            fpath = os.path.join(DASHBOARD_DIR, fname)
            try:
                with open(fpath, encoding='utf-8') as f:
                    parts.append(f'// ── {fname} ──\n' + f.read())
            except Exception as e:
                parts.append(f'// MISSING: {fname}: {e}')
        bundle = '\n\n'.join(parts)
        html = _HTML_TEMPLATE.format(jsx_bundle=bundle)
        return Response(html, mimetype='text/html')

    @app.route('/<path:fn>')
    def static_file(fn):
        return send_from_directory(DASHBOARD_DIR, fn)

    # ── API ────────────────────────────────────────────────────────────────────
    @app.route('/api/ouvidorias', methods=['GET'])
    def api_list():
        path = _excel()
        if not os.path.exists(path):
            return jsonify([])
        try:
            from openpyxl import load_workbook
            wb = load_workbook(path, read_only=True)
            sheet = 'Ouvidorias' if 'Ouvidorias' in wb.sheetnames else wb.sheetnames[0]
            ws = wb[sheet]
            headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
            rows = []
            for row in ws.iter_rows(min_row=2, values_only=True):
                item = {}
                for i, h in enumerate(headers):
                    if h:
                        v = row[i] if i < len(row) else None
                        item[h] = str(v) if v is not None else ''
                if any(v for v in item.values()):
                    rows.append(item)
            wb.close()
            return jsonify(rows)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/ouvidorias', methods=['POST', 'OPTIONS'])
    def api_create():
        if request.method == 'OPTIONS':
            return '', 204
        data = request.get_json(force=True) or {}
        if not data.get('Protocolo'):
            data['Protocolo'] = f"MANUAL-{int(time.time())}"
        ok = _append_row(data)
        return jsonify({'ok': ok, 'protocolo': data['Protocolo']}), 201 if ok else 500

    @app.route('/api/ouvidorias/<path:proto>', methods=['PATCH', 'OPTIONS'])
    def api_update(proto):
        if request.method == 'OPTIONS':
            return '', 204
        updates = request.get_json(force=True) or {}
        ok = _patch_row(proto, updates)
        return jsonify({'ok': ok}), 200 if ok else 404

    @app.route('/api/cobrar', methods=['POST', 'OPTIONS'])
    def api_cobrar():
        if request.method == 'OPTIONS':
            return '', 204
        try:
            import cobrar as _cobrar
            body = request.get_json(force=True) or {}
            unidades = body.get('unidades') or None  # None = todas
            logs = []
            stats = _cobrar.executar_cobranca(log_func=logs.append, unidades_filtro=unidades)
            return jsonify({'ok': True, 'stats': stats, 'log': logs})
        except Exception as e:
            return jsonify({'ok': False, 'error': str(e)}), 500

    # ── Excel write helpers ────────────────────────────────────────────────────
    _EXTRA_COLS = ['Reclamante', 'Canal']

    def _ensure_cols(ws):
        """Garante que Reclamante e Canal existem no cabeçalho."""
        from openpyxl.styles import Font, PatternFill
        cur = [ws.cell(1, i).value for i in range(1, ws.max_column + 2)]
        for col in _EXTRA_COLS:
            if col not in cur:
                idx = ws.max_column + 1
                c = ws.cell(1, idx, col)
                c.font  = Font(bold=True, color='FFFFFF', name='Arial', size=11)
                c.fill  = PatternFill('solid', start_color='2B5597')

    def _append_row(data: dict) -> bool:
        try:
            from openpyxl import load_workbook, Workbook
            from openpyxl.styles import Font, PatternFill, Alignment

            path = _excel()
            os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)

            if os.path.exists(path):
                wb = load_workbook(path)
            else:
                wb = Workbook(); wb.remove(wb.active)

            if 'Ouvidorias' not in wb.sheetnames:
                from constantes import COLUNAS_OUV
                ws = wb.create_sheet('Ouvidorias')
                for i, col in enumerate(COLUNAS_OUV + _EXTRA_COLS, 1):
                    c = ws.cell(1, i, col)
                    c.font  = Font(bold=True, color='FFFFFF', name='Arial', size=11)
                    c.fill  = PatternFill('solid', start_color='2B5597')
                    c.alignment = Alignment(horizontal='center', vertical='center')
                ws.freeze_panes = 'A2'
            else:
                ws = wb['Ouvidorias']
                _ensure_cols(ws)

            headers = [ws.cell(1, i).value for i in range(1, ws.max_column + 1)]
            row_n   = ws.max_row + 1
            for col, val in data.items():
                if col in headers:
                    ws.cell(row_n, headers.index(col) + 1, str(val) if val else '')

            wb.save(path)
            wb.close()
            return True
        except Exception as e:
            print(f'[Dashboard] Erro ao criar linha: {e}')
            return False

    def _patch_row(proto: str, updates: dict) -> bool:
        try:
            from openpyxl import load_workbook
            path = _excel()
            if not os.path.exists(path):
                return False
            wb = load_workbook(path)
            if 'Ouvidorias' not in wb.sheetnames:
                wb.close(); return False
            ws = wb['Ouvidorias']
            _ensure_cols(ws)
            headers  = [ws.cell(1, i).value for i in range(1, ws.max_column + 1)]
            pcol     = next((i + 1 for i, h in enumerate(headers) if h == 'Protocolo'), None)
            if not pcol:
                wb.close(); return False
            for row in range(2, ws.max_row + 1):
                if str(ws.cell(row, pcol).value or '').strip() == proto.strip():
                    # refresh headers after _ensure_cols may have added cols
                    headers = [ws.cell(1, i).value for i in range(1, ws.max_column + 1)]
                    for col, val in updates.items():
                        if col in headers:
                            ws.cell(row, headers.index(col) + 1, str(val) if val else '')
                    wb.save(path)
                    wb.close()
                    return True
            wb.close()
            return False
        except Exception as e:
            print(f'[Dashboard] Erro ao atualizar linha: {e}')
            return False

# ── public start ───────────────────────────────────────────────────────────────
_started = False

def start_server(port: int = PORT) -> int:
    global _started
    if not FLASK_OK:
        print('[Dashboard] Flask não instalado — execute: pip install flask')
        return 0
    if _started:
        return port
    _started = True

    def _run():
        import logging
        logging.getLogger('werkzeug').setLevel(logging.ERROR)
        app.run(host='127.0.0.1', port=port, debug=False, use_reloader=False)

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return port


if __name__ == '__main__':
    p = start_server()
    print(f'Dashboard em http://localhost:{p}')
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        pass
