"""Gera financas/index.html e adm/index.html a partir de index.html.

Os três apps (Transporte, Finanças e ADM Entregas) usam o mesmo código: a página
descobre pelo endereço (/financas/ ou /adm/) qual app mostrar. Este script só
ajusta o cabeçalho (título, prévia, ícones) e os caminhos dos arquivos.

Rode depois de mudar index.html:  python3 tools/gerar-apps.py
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
BASE = "https://splogadonai.github.io/entregas/"


def rep(s, a, b, count=None):
    n = s.count(a)
    if count is not None and n != count:
        raise SystemExit(f"esperava {count}x, achei {n}x: {a[:70]}")
    if n == 0:
        raise SystemExit(f"não encontrei: {a[:70]}")
    return s.replace(a, b)


def gerar(pasta, titulo, desc, nome_app, nome_curto):
    s = src
    s = rep(s, BASE, f"{BASE}{pasta}/")
    s = rep(s, "SPLOG · Gestão de entregas", titulo)
    s = rep(s, "Entregas, custos, combustível e lucro da operação em um só lugar.", desc)
    s = rep(s, '<meta name="apple-mobile-web-app-title" content="SPLOG">', f'<meta name="apple-mobile-web-app-title" content="{nome_curto}">', 1)
    s = rep(s, '<meta name="application-name" content="SPLOG">', f'<meta name="application-name" content="{nome_app}">', 1)
    s = rep(s, '<link rel="icon" href="favicon.svg"', '<link rel="icon" href="../favicon.svg"', 1)
    s = rep(s, '<link rel="icon" href="favicon-32.png"', '<link rel="icon" href="../favicon-32.png"', 1)
    s = rep(s, '<script src="config.js"></script>', '<script src="../config.js"></script>', 1)
    s = rep(s, 'navigator.serviceWorker.register("./sw.js")', 'navigator.serviceWorker.register("../sw.js")', 1)
    s = rep(s, "<head>\n", "<head>\n<!-- Gerado a partir de ../index.html por tools/gerar-apps.py. Não edite aqui. -->\n", 1)
    os.makedirs(os.path.join(ROOT, pasta), exist_ok=True)
    open(os.path.join(ROOT, pasta, "index.html"), "w", encoding="utf-8").write(s)
    print(f"{pasta}/index.html gerado")


gerar("financas", "SPLOG · Finanças da família", "Orçamento, lançamentos, metas e previsão do saldo da família.", "SPLOG Finanças", "Finanças")
gerar("adm", "SPLOG · ADM Entregas", "Painel de entregas (PM e checklist) com quantidades por dia, semana e mês, e relatórios em PDF.", "SPLOG ADM Entregas", "ADM Entregas")
