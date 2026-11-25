"""Mantido por compatibilidade: gera os apps de Finanças e ADM Entregas (ver gerar-apps.py)."""
import os
import runpy

runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "gerar-apps.py"))
