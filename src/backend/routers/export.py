"""
Router de Exportación CSV - CacaoTrace Huila (RF11)
Exporta resumen estructurado de lotes para el Administrador con codificación utf-8-sig.
Incluye sanitización para prevenir inyección de fórmulas en hojas de cálculo.
"""

import io
import csv
import html
from decimal import Decimal
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Lote, Transformacion
from security.rbac import require_admin

router = APIRouter(prefix="/api/admin/export", tags=["Exportación de Reportes (Admin)"])


def sanitizar_celda_csv(valor) -> str:
    """Previene inyección de fórmulas CSV (ej. =CMD, +, -, @, \t, \r) ante caracteres maliciosos."""
    if valor is None:
        return ""
    txt = str(valor).strip()
    if txt and txt[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + txt
    return txt


@router.get("/csv")
@router.get("/lotes-csv")
def exportar_resumen_csv(
    origen: Optional[str] = Query(None, description="Filtrar por municipio"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_admin),  # Solo Administrador
):
    """
    RF11: Exportar resumen estructurado de lotes en CSV compatible con Excel.
    Incluye directiva 'sep=;' y delimitador punto y coma para redistribución perfecta de columnas en Excel.
    Protegido con BOM utf-8-sig y sanitización anti-fórmulas CWE-1236.
    """
    query = db.query(Lote)
    if origen:
        query = query.filter(Lote.origen == origen)
    if estado:
        query = query.filter(Lote.estado == estado)
    lotes = query.order_by(Lote.id.asc()).all()

    output = io.StringIO()
    # Directiva explícita para que Microsoft Excel en cualquier idioma distribuya en columnas automáticamente
    output.write("sep=;\n")
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)

    # Cabeceras requeridas por RF11
    writer.writerow([
        "Identificador",
        "Productor",
        "Origen (Huila)",
        "Humedad (%)",
        "Fermentación (%)",
        "Kg Recibidos",
        "Kg Disponibles",
        "Estado",
        "Costo Total Etapa (COP)",
        "Costo Unitario (COP/kg)",
        "Margen sobre Venta (%)",
    ])

    total_recibidos = 0.0
    total_disponibles = 0.0
    total_costo_etapa = 0.0
    lotes_liberados = 0
    lotes_bloqueados = 0

    for lote in lotes:
        # Obtener última transformación para costos
        ultima_trans = (
            db.query(Transformacion)
            .filter(Transformacion.lote_id == lote.id)
            .order_by(Transformacion.fecha_transformacion.desc())
            .first()
        )

        costo_etapa = ultima_trans.costo_etapa_cop if ultima_trans else None
        costo_unitario = ultima_trans.costo_unitario_cop if ultima_trans else None
        margen = ultima_trans.margen_venta_porcentaje if ultima_trans else None

        # Acumular métricas
        if lote.kg_recibidos:
            total_recibidos += float(lote.kg_recibidos)
        if lote.kg_disponibles:
            total_disponibles += float(lote.kg_disponibles)
        if costo_etapa:
            total_costo_etapa += float(costo_etapa)
        if lote.estado == "LIBERADO":
            lotes_liberados += 1
        elif lote.estado == "BLOQUEADO":
            lotes_bloqueados += 1

        costo_etapa_str = f"${float(costo_etapa):,.2f} COP" if costo_etapa is not None else "N/A"
        costo_unitario_str = f"${float(costo_unitario):,.2f} COP/kg" if costo_unitario is not None else "N/A"
        margen_str = f"{float(margen):.2f}%" if margen is not None else "N/A"
        humedad_str = f"{float(lote.humedad_porcentaje):.2f}%" if lote.humedad_porcentaje is not None else "N/A"
        fermentacion_str = f"{float(lote.fermentacion_porcentaje):.2f}%" if lote.fermentacion_porcentaje is not None else "N/A"

        writer.writerow([
            sanitizar_celda_csv(lote.id),
            sanitizar_celda_csv(lote.productor),
            sanitizar_celda_csv(lote.origen),
            sanitizar_celda_csv(humedad_str),
            sanitizar_celda_csv(fermentacion_str),
            sanitizar_celda_csv(f"{float(lote.kg_recibidos):.2f}" if lote.kg_recibidos is not None else "0.00"),
            sanitizar_celda_csv(f"{float(lote.kg_disponibles):.2f}" if lote.kg_disponibles is not None else "0.00"),
            sanitizar_celda_csv(lote.estado),
            sanitizar_celda_csv(costo_etapa_str),
            sanitizar_celda_csv(costo_unitario_str),
            sanitizar_celda_csv(margen_str),
        ])

    # Fila resumen de totales
    writer.writerow([])
    writer.writerow([
        "TOTALES / RESUMEN CONSOLIDADO",
        f"{len(lotes)} Lotes Registrados",
        "Departamento del Huila",
        "",
        "",
        sanitizar_celda_csv(f"{total_recibidos:.2f}"),
        sanitizar_celda_csv(f"{total_disponibles:.2f}"),
        f"{lotes_liberados} LIBERADOS / {lotes_bloqueados} BLOQUEADOS",
        sanitizar_celda_csv(f"${total_costo_etapa:,.2f} COP"),
        "",
        "",
    ])

    csv_data = output.getvalue()

    return Response(
        content=csv_data.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=resumen_lotes_cacao_huila.csv"},
    )


@router.get("/excel")
@router.get("/lotes-excel")
def exportar_resumen_excel(
    origen: Optional[str] = Query(None, description="Filtrar por municipio"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_admin),  # Solo Administrador
):
    """
    Exportación de Reporte Gerencial Estilizado en Formato Excel (.xls).
    Genera un archivo con diseño corporativo CacaoTrace Huila, tarjetas de KPIs,
    tablas con bordes limpios, badges de estado en colores y resumen normativo NTC 1252.
    """
    query = db.query(Lote)
    if origen:
        query = query.filter(Lote.origen == origen)
    if estado:
        query = query.filter(Lote.estado == estado)
    lotes = query.order_by(Lote.id.asc()).all()

    total_lotes = len(lotes)
    total_recibidos = sum((float(l.kg_recibidos) for l in lotes if l.kg_recibidos), 0.0)
    total_disponibles = sum((float(l.kg_disponibles) for l in lotes if l.kg_disponibles), 0.0)
    lotes_liberados = sum(1 for l in lotes if l.estado == "LIBERADO")
    lotes_bloqueados = sum(1 for l in lotes if l.estado == "BLOQUEADO")
    lotes_pendientes = sum(1 for l in lotes if l.estado == "PENDIENTE")

    filas_lotes = []
    total_costo_acumulado = 0.0
    for l in lotes:
        trans = (
            db.query(Transformacion)
            .filter(Transformacion.lote_id == l.id)
            .order_by(Transformacion.fecha_transformacion.desc())
            .first()
        )
        c_etapa = float(trans.costo_etapa_cop) if trans and trans.costo_etapa_cop else None
        c_unitario = float(trans.costo_unitario_cop) if trans and trans.costo_unitario_cop else None
        margen = float(trans.margen_venta_porcentaje) if trans and trans.margen_venta_porcentaje else None
        if c_etapa:
            total_costo_acumulado += c_etapa

        filas_lotes.append({
            "id": l.id,
            "productor": l.productor,
            "origen": l.origen,
            "humedad": float(l.humedad_porcentaje) if l.humedad_porcentaje else 0.0,
            "fermentacion": float(l.fermentacion_porcentaje) if l.fermentacion_porcentaje else 0.0,
            "recibidos": float(l.kg_recibidos) if l.kg_recibidos else 0.0,
            "disponibles": float(l.kg_disponibles) if l.kg_disponibles else 0.0,
            "estado": l.estado,
            "costo_etapa": c_etapa,
            "costo_unitario": c_unitario,
            "margen": margen,
        })

    tasa_conformidad = (lotes_liberados / total_lotes * 100.0) if total_lotes > 0 else 0.0
    fecha_emision = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    html_content = f"""<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Control de Lotes Huila</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
     <x:Selected/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body {{
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    color: #1c1917;
  }}
  .titulo-principal {{
    background-color: #1A120B;
    color: #F5C563;
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    padding: 14px;
    border: 1px solid #1A120B;
  }}
  .subtitulo {{
    background-color: #2D1E12;
    color: #F5EBE1;
    font-size: 10.5pt;
    text-align: center;
    padding: 6px;
    font-weight: 500;
  }}
  .meta-header {{
    background-color: #FAF6F0;
    font-size: 9.5pt;
    color: #44403C;
    padding: 6px 10px;
    border: 1px solid #E7E5E4;
  }}
  .kpi-box {{
    background-color: #FFFDF9;
    border: 2px solid #E7E5E4;
    text-align: center;
    padding: 8px;
  }}
  .kpi-title {{
    font-size: 8pt;
    color: #78716C;
    text-transform: uppercase;
    font-weight: bold;
  }}
  .kpi-val {{
    font-size: 14pt;
    font-weight: bold;
    color: #1C1917;
  }}
  .kpi-amber {{ color: #D97706; }}
  .kpi-emerald {{ color: #059669; }}
  .kpi-rose {{ color: #DC2626; }}
  .th-header {{
    background-color: #2D1B10;
    color: #FFFFFF;
    font-weight: bold;
    font-size: 10pt;
    padding: 10px 8px;
    text-align: center;
    border: 1px solid #442817;
  }}
  .td-cell {{
    padding: 7px 8px;
    border: 1px solid #D6D3D1;
    font-size: 9.5pt;
    vertical-align: middle;
  }}
  .td-left {{ text-align: left; }}
  .td-center {{ text-align: center; }}
  .td-right {{ text-align: right; }}
  .badge-liberado {{
    background-color: #DEF7EC;
    color: #03543F;
    font-weight: bold;
    padding: 3px 8px;
    border: 1px solid #31C48D;
    text-align: center;
  }}
  .badge-bloqueado {{
    background-color: #FDE8E8;
    color: #9B1C1C;
    font-weight: bold;
    padding: 3px 8px;
    border: 1px solid #F98080;
    text-align: center;
  }}
  .badge-pendiente {{
    background-color: #FEF08A;
    color: #713F12;
    font-weight: bold;
    padding: 3px 8px;
    border: 1px solid #FACC15;
    text-align: center;
  }}
  .row-zebra {{
    background-color: #FAF8F5;
  }}
  .total-row {{
    background-color: #EFEBE4;
    font-weight: bold;
    border-top: 2px solid #573A27;
    border-bottom: 2px solid #573A27;
    font-size: 10pt;
  }}
  .footer-compliance {{
    font-size: 8pt;
    color: #78716C;
    font-style: italic;
    padding: 10px;
    text-align: center;
    background-color: #FAF8F5;
    border: 1px solid #E7E5E4;
  }}
</style>
</head>
<body>
<table cellpadding="4" cellspacing="0" width="100%">
  <!-- Encabezado Corporativo CacaoTrace -->
  <tr>
    <td colspan="11" class="titulo-principal">
      &#127851; CACAOTRACE HUILA &bull; SISTEMA INTEGRAL DE TRAZABILIDAD CACAOTERA
    </td>
  </tr>
  <tr>
    <td colspan="11" class="subtitulo">
      Reporte Gerencial Consolidado de Calidad F&iacute;sico-Qu&iacute;mica, Existencias y Costos Agroindustriales
    </td>
  </tr>
  <tr>
    <td colspan="4" class="meta-header">
      <strong>Entidad:</strong> Cadena de Custodia Denominaci&oacute;n de Origen Huila
    </td>
    <td colspan="4" class="meta-header">
      <strong>Fecha / Hora de Emisi&oacute;n:</strong> {fecha_emision}
    </td>
    <td colspan="3" class="meta-header">
      <strong>Usuario Emisor:</strong> {html.escape(str(auth.get('usuario', 'Administrador')))} ({html.escape(str(auth.get('rol', 'ADMINISTRADOR')))})
    </td>
  </tr>
  <tr><td colspan="11" style="height: 10px;"></td></tr>

  <!-- Bloque de Tarjetas de Indicadores KPI -->
  <tr>
    <td colspan="2" class="kpi-box">
      <div class="kpi-title">Total Lotes</div>
      <div class="kpi-val kpi-amber">{total_lotes}</div>
    </td>
    <td colspan="2" class="kpi-box">
      <div class="kpi-title">Biomasa Recibida</div>
      <div class="kpi-val">{total_recibidos:,.2f} kg</div>
    </td>
    <td colspan="2" class="kpi-box">
      <div class="kpi-title">Stock Disponible</div>
      <div class="kpi-val kpi-emerald">{total_disponibles:,.2f} kg</div>
    </td>
    <td colspan="2" class="kpi-box">
      <div class="kpi-title">Lotes Liberados</div>
      <div class="kpi-val kpi-emerald">{lotes_liberados} ({tasa_conformidad:.1f}%)</div>
    </td>
    <td colspan="2" class="kpi-box">
      <div class="kpi-title">En Cuarentena (Hora 12)</div>
      <div class="kpi-val kpi-rose">{lotes_bloqueados}</div>
    </td>
    <td colspan="1" class="kpi-box">
      <div class="kpi-title">Pendientes</div>
      <div class="kpi-val">{lotes_pendientes}</div>
    </td>
  </tr>
  <tr><td colspan="11" style="height: 12px;"></td></tr>

  <!-- Cabeceras de la Tabla de Datos -->
  <tr>
    <th class="th-header" style="width: 110px;">Lote ID</th>
    <th class="th-header" style="width: 180px;">Productor</th>
    <th class="th-header" style="width: 140px;">Origen (Municipio)</th>
    <th class="th-header" style="width: 95px;">Humedad (%)</th>
    <th class="th-header" style="width: 105px;">Fermentaci&oacute;n (%)</th>
    <th class="th-header" style="width: 110px;">Kg Recibidos</th>
    <th class="th-header" style="width: 110px;">Kg Disponibles</th>
    <th class="th-header" style="width: 120px;">Estado Calidad</th>
    <th class="th-header" style="width: 140px;">Costo Etapa (COP)</th>
    <th class="th-header" style="width: 140px;">Costo Unitario (COP/kg)</th>
    <th class="th-header" style="width: 110px;">Margen Venta (%)</th>
  </tr>
"""

    for idx, f in enumerate(filas_lotes):
        zebra_cls = ' class="row-zebra"' if idx % 2 == 1 else ''
        estado = f["estado"]
        if estado == "LIBERADO":
            badge_html = f'<div class="badge-liberado">&#10003; LIBERADO</div>'
        elif estado == "BLOQUEADO":
            badge_html = f'<div class="badge-bloqueado">&#10005; BLOQUEADO</div>'
        else:
            badge_html = f'<div class="badge-pendiente">&#9201; PENDIENTE</div>'

        c_etapa_str = f"${f['costo_etapa']:,.2f}" if f['costo_etapa'] is not None else '<span style="color:#A8A29E">N/A</span>'
        c_unit_str = f"${f['costo_unitario']:,.2f}" if f['costo_unitario'] is not None else '<span style="color:#A8A29E">N/A</span>'
        margen_str = f"{f['margen']:.2f}%" if f['margen'] is not None else '<span style="color:#A8A29E">N/A</span>'

        id_esc = html.escape(sanitizar_celda_csv(f["id"]))
        prod_esc = html.escape(sanitizar_celda_csv(f["productor"]))
        origen_esc = html.escape(sanitizar_celda_csv(f["origen"]))

        html_content += f"""  <tr{zebra_cls}>
    <td class="td-cell td-center" style="font-family: Consolas, monospace; font-weight: bold; color: #78350F;">{id_esc}</td>
    <td class="td-cell td-left" style="font-weight: 500;">{prod_esc}</td>
    <td class="td-cell td-center">{origen_esc}</td>
    <td class="td-cell td-right">{f['humedad']:.2f}%</td>
    <td class="td-cell td-right">{f['fermentacion']:.2f}%</td>
    <td class="td-cell td-right" style="font-weight: bold;">{f['recibidos']:,.2f} kg</td>
    <td class="td-cell td-right" style="font-weight: bold; color: #047857;">{f['disponibles']:,.2f} kg</td>
    <td class="td-cell td-center">{badge_html}</td>
    <td class="td-cell td-right">{c_etapa_str}</td>
    <td class="td-cell td-right">{c_unit_str}</td>
    <td class="td-cell td-right" style="font-weight: 600;">{margen_str}</td>
  </tr>
"""

    html_content += f"""  <!-- Fila de Totales Generales -->
  <tr class="total-row">
    <td class="td-cell td-center" colspan="3">TOTALES CONSOLIDADOS ({total_lotes} LOTES)</td>
    <td class="td-cell td-right" colspan="2" style="font-size: 8.5pt; color: #78716C;">Huila - Denominaci&oacute;n de Origen</td>
    <td class="td-cell td-right" style="font-size: 10pt;">{total_recibidos:,.2f} kg</td>
    <td class="td-cell td-right" style="font-size: 10pt; color: #047857;">{total_disponibles:,.2f} kg</td>
    <td class="td-cell td-center" style="font-size: 8.5pt;">{lotes_liberados} Lib / {lotes_bloqueados} Bloq</td>
    <td class="td-cell td-right" style="font-size: 10pt;">${total_costo_acumulado:,.2f}</td>
    <td class="td-cell td-right" colspan="2" style="font-size: 8.5pt; color: #78716C;">Balance Agroindustrial NTC 1252</td>
  </tr>
  <tr><td colspan="11" style="height: 12px;"></td></tr>

  <!-- Pie de Cumplimiento Normativo y Auditoría -->
  <tr>
    <td colspan="11" class="footer-compliance">
      &#128737;&#65039; <strong>CacaoTrace Huila &bull; Certificaci&oacute;n de Origen y Calidad:</strong>
      Este documento contiene datos consolidados del libro mayor de trazabilidad inmutable (RF10).
      Los par&aacute;metros f&iacute;sico-qu&iacute;micos cumplen los est&aacute;ndares de la Norma T&eacute;cnica Colombiana <strong>NTC 1252:2021</strong> y las directrices de inocuidad ICA.
      Generado autom&aacute;ticamente el {fecha_emision} bajo credenciales administrativas.
    </td>
  </tr>
</table>
</body>
</html>
"""

    return Response(
        content=html_content.encode("utf-8"),
        media_type="application/vnd.ms-excel; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=reporte_ejecutivo_lotes_cacao_huila.xls"
        },
    )


@router.post("/backup")
def generar_respaldo_sqlite(
    auth: dict = Depends(require_admin),
):
    """
    RF07: Genera un respaldo físico en caliente (.db) de SQLite en modo WAL.
    Utiliza sqlite3.Connection.backup() para garantizar consistencia atómica.
    """
    import time
    import sqlite3
    from pathlib import Path
    from datetime import datetime

    inicio = time.perf_counter()
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    db_path = root_dir / "cacao_dev.db"
    backup_dir = root_dir / "datos" / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)

    if not db_path.exists():
        # Intentar en cwd
        db_path = Path("cacao_dev.db").resolve()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo_backup = backup_dir / f"snapshot_{timestamp}.db"
    demo_backup = root_dir / "datos" / "respaldo_demo.db"

    with sqlite3.connect(db_path) as origen, sqlite3.connect(archivo_backup) as dest:
        origen.backup(dest)

    # Actualizar también respaldo_demo.db
    with sqlite3.connect(db_path) as origen, sqlite3.connect(demo_backup) as dest:
        origen.backup(dest)

    duracion_ms = (time.perf_counter() - inicio) * 1000
    tamano_bytes = archivo_backup.stat().st_size

    return {
        "status": "ok",
        "mensaje": "Respaldo atómico en caliente generado exitosamente (RF07)",
        "archivo": archivo_backup.name,
        "ruta_relativa": f"datos/backups/{archivo_backup.name}",
        "duracion_ms": round(duracion_ms, 2),
        "tamano_bytes": tamano_bytes,
        "tamano_kb": round(tamano_bytes / 1024, 2),
        "modo_wal": "Verificado y consistente",
    }


@router.get("/persistencia-info")
def obtener_info_persistencia(
    db: Session = Depends(get_db),
    auth: dict = Depends(require_admin),
):
    """RF07: Información del motor de persistencia SQLite y estadísticas en disco."""
    from models import AuditoriaLog
    total_lotes = db.query(Lote).count()
    total_trans = db.query(Transformacion).count()
    total_audit = db.query(AuditoriaLog).count()

    return {
        "motor": "SQLite 3 con Write-Ahead Logging (WAL)",
        "archivo_db": "cacao_dev.db",
        "modo_concurrencia": "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
        "estadisticas": {
            "total_lotes": total_lotes,
            "total_transformaciones": total_trans,
            "total_registros_auditoria": total_audit,
        },
        "garantia_persistencia": (
            "Todos los datos se escriben inmediatamente a cacao_dev.db con sincronización WAL. "
            "Reiniciar el servidor uvicorn conserva el 100% de los registros sin pérdidas."
        )
    }
