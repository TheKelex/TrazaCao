"""
Gestor de Túnel Público Seguro para Demostración en Vivo - TrazaCao Huila
Conecta el backend FastAPI local (SQLite) a la web mediante Ngrok
sin requerir migraciones de base de datos ni configuraciones complejas de red.
"""

import subprocess
import time
import sys
import json
import urllib.request
import webbrowser

PORT = 8000
NGROK_API = "http://127.0.0.1:4040/api/tunnels"

def verificar_backend():
    """Verifica si el backend FastAPI está respondiendo en el puerto 8000."""
    try:
        req = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/docs", timeout=2)
        return req.status == 200
    except Exception:
        return False

def obtener_url_tunel(max_intentos=15):
    """Consulta la API local de Ngrok (puerto 4040) para obtener la URL pública asignada."""
    for _ in range(max_intentos):
        try:
            req = urllib.request.Request(
                NGROK_API,
                headers={"User-Agent": "TrazaCao-Launcher"}
            )
            with urllib.request.urlopen(req, timeout=2) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                tunnels = data.get("tunnels", [])
                for t in tunnels:
                    # Preferir HTTPS
                    if t.get("public_url", "").startswith("https://"):
                        return t["public_url"]
                if tunnels:
                    return tunnels[0]["public_url"]
        except Exception:
            pass
        time.sleep(1)
    return None

def main():
    print("=" * 76)
    print("      TRAZACAO HUILA - INICIALIZADOR DE TUNEL PUBLICO (MODO HIBRIDO)")
    print("   II Hackathon de Programacion DEVURITY - Universidad Surcolombiana")
    print("=" * 76)
    print()

    # 1. Comprobar backend
    print(f"[*] Comprobando disponibilidad del backend en http://127.0.0.1:{PORT}...")
    if not verificar_backend():
        print("[!] AVISO: El backend FastAPI no responde en el puerto 8000.")
        print("[*] Levantando FastAPI con uvicorn en segundo plano...")
        subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "src.backend.main:app", "--host", "0.0.0.0", "--port", str(PORT)],
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
        )
        print("[*] Esperando inicializacion del backend...")
        for _ in range(10):
            time.sleep(1)
            if verificar_backend():
                print("[+] Backend iniciado exitosamente.")
                break
        else:
            print("[!] Advertencia: No se pudo confirmar respuesta en /docs, continuando...")
    else:
        print("[+] Backend local verificado y activo.")

    # 2. Iniciar Ngrok en nueva ventana de consola
    print("[*] Iniciando tunel seguro de Ngrok hacia el puerto 8000...")
    ngrok_process = subprocess.Popen(
        ["ngrok", "http", str(PORT)],
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
    )

    print("[*] Estableciendo sesion TLS con el edge de Ngrok...")
    public_url = obtener_url_tunel()

    print()
    if public_url:
        ficha_url = f"{public_url}/ficha"
        docs_url = f"{public_url}/docs"
        landing_url = f"{public_url}/landing"

        print("=" * 76)
        print(" [!] TUNEL PUBLICO ESTABLECIDO Y LISTO PARA LA DEMO EN VIVO")
        print("=" * 76)
        print(f" > Aplicacion Web SPA:           {public_url}/")
        print(f" > Experiencia Visual (Landing): {landing_url}")
        print(f" > Ficha Comercial QR (Movil):   {ficha_url}")
        print(f" > Swagger / OpenAPI Docs:       {docs_url}")
        print(f" > Monitor de Trafico en Vivo:   http://127.0.0.1:4040")
        print("=" * 76)
        print()
        print("[*] Copia el enlace de la Ficha Comercial QR para que los jurados o compradores")
        print("    puedan escanearlo o abrirlo en sus dispositivos moviles.")
        print()
        print("Presiona Ctrl+C o cierra esta ventana para terminar el tunel.")
    else:
        print("[!] No se pudo obtener la URL publica automaticamente desde http://127.0.0.1:4040.")
        print("[*] Por favor revisa la ventana de Ngrok abierta para ver la URL asignada.")

    try:
        # Mantener el script vivo mientras el usuario no lo cierre
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        print("\n[*] Cerrando tunel...")
        ngrok_process.terminate()

if __name__ == "__main__":
    main()
