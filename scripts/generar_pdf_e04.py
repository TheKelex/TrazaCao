#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar el entregable oficial en formato PDF:
documentos/E04_manual.pdf
TrazaCao (E04 Producto Mínimo Viable y Manual de Usuario)
II Hackathon DEVURITY - Universidad Surcolombiana (USCO)
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        # Header banner line
        self.setFillColor(colors.HexColor("#1B3B2B"))
        self.rect(36, 756, 540, 2, fill=True, stroke=False)
        
        # Header text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1B3B2B"))
        self.drawString(36, 762, "TRAZACAO HUILA — MANUAL DE USUARIO Y GUÍA DE DEMOSTRACIÓN MVP (E04)")
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(576, 762, "II HACKATHON DEVURITY · USCO 2026")

        # Footer divider line
        self.setFillColor(colors.HexColor("#CBD5E1"))
        self.rect(36, 36, 540, 0.8, fill=True, stroke=False)

        # Footer text
        self.setFont("Helvetica", 7.2)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 25, "TrazaCao Huila — Trazabilidad Agroindustrial con Historia y Valor | Código y Manual de Usuario Oficial")
        
        page_str = f"Página {self._pageNumber} de {total_pages}"
        self.drawRightString(576, 25, page_str)
        self.restoreState()

def generar_pdf_e04(output_path="documentos/E04_manual.pdf"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Palette
    c_primary = colors.HexColor("#1B3B2B")
    c_secondary = colors.HexColor("#2D6A4F")
    c_accent = colors.HexColor("#B45309")
    c_dark = colors.HexColor("#0F172A")
    c_muted = colors.HexColor("#334155")
    c_border = colors.HexColor("#CBD5E1")
    c_card_bg = colors.HexColor("#F8FAFC")
    c_code_bg = colors.HexColor("#F1F5F9")

    # Typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=c_primary,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=c_accent,
        spaceAfter=6
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12.5,
        textColor=c_secondary,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.2,
        textColor=c_dark,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.8,
        textColor=c_dark,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.2,
        leading=9.2,
        textColor=c_dark
    )

    th_style = ParagraphStyle(
        'TH_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TD_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.8,
        textColor=c_dark
    )

    td_bold = ParagraphStyle(
        'TDBold_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.8,
        textColor=c_dark
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("TrazaCao (E04 Producto Mínimo Viable y Manual de Usuario)", title_style))
    story.append(Paragraph("II HACKATHON DE PROGRAMACIÓN DEVURITY — UNIVERSIDAD SURCOLOMBIANA (USCO) | RETO AGROINDUSTRIA CACAO", subtitle_style))
    story.append(Paragraph("<b>Equipo Oficial:</b> TrazaCao Huila (Equipo 1) &nbsp;|&nbsp; <b>Rama Principal:</b> <code>develop</code> &nbsp;|&nbsp; <b>Pruebas Automatizadas:</b> 38/38 Passed", body_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=4, spaceAfter=6))

    # SECTION 1
    story.append(Paragraph("1. Introducción y Arquitectura General del Sistema", h1_style))
    story.append(Paragraph(
        "<b>TrazaCao Huila</b> es una plataforma de software integral de trazabilidad agroindustrial, inventario y comercialización ética "
        "diseñada específicamente para asociaciones cacaoteras del departamento del Huila (municipios de Rivera, Campoalegre y Algeciras). "
        "El sistema fue concebido bajo el principio rector de <b>Autonomía y Resiliencia 100% Offline</b>, garantizando operatividad ininterrumpida "
        "en centros de acopio rurales con conectividad deficiente o nula, así como en recintos cerrados de exhibición comercial (como Oasis Plaza).",
        body_style
    ))

    # Architecture diagram block as table
    arch_box = [
        [Paragraph("<b>ESTRUCTURA ARQUITECTURAL — ONION ARCHITECTURE (CLEAN LITE) & COMPONENTES</b>", th_style)],
        [Paragraph(
            "• <b>Frontend SPA:</b> React 19 + Vite + Tailwind CSS compilado en local (cero fuentes o scripts de CDNs externos). Incorpora "
            "normalizador de errores <code>errorHandler.js</code>, generador vectorial SVG de códigos QR (<code>qrcode.react</code>) y simulador móvil de 375px.<br/>"
            "• <b>Backend Core (FastAPI):</b> Capa <code>domain/</code> pura en <code>Decimal</code> (fórmulas de merma, costos, margen y blindaje RF12 sin dependencias "
            "de frameworks), capa <code>services/</code> para consumo atómico condicional, y capa <code>security/</code> con validación RBAC nativa.<br/>"
            "• <b>Persistencia e Inmutabilidad (SQLite WAL):</b> Base embebida <code>cacao_dev.db</code> con <code>PRAGMA journal_mode=WAL;</code> y "
            "<code>PRAGMA busy_timeout=5000;</code>. Triggers DDL <code>BEFORE UPDATE</code> y <code>BEFORE DELETE</code> en <code>audit_logs</code> abortan "
            "físicamente cualquier manipulación fraudulenta.<br/>"
            "• <b>Respaldo y Recuperación Atómica:</b> Instantáneas en caliente mediante la API oficial <code>sqlite3.backup()</code> ejecutadas en menos de 20 ms.",
            td_style
        )]
    ]
    t_arch = Table(arch_box, colWidths=[540])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('BACKGROUND', (0, 1), (-1, 1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 6))

    # SECTION 2
    story.append(Paragraph("2. Guía de Instalación y Arranque Rápido", h1_style))
    story.append(Paragraph("<b>2.1 Requisitos Previos:</b> Python 3.10+ (con pip), Node.js v18+ (con npm). Compatible con Windows, Linux y macOS.", body_style))
    story.append(Paragraph("<b>2.2 Arranque en 1 Solo Clic (Recomendado para Evaluación en Windows):</b>", body_style))
    
    cmd_data = [
        [Paragraph("<b>Entorno de Ejecución</b>", th_style), Paragraph("<b>Comando Oficial de Arranque</b>", th_style), Paragraph("<b>Efecto Inmediato</b>", th_style)],
        [Paragraph("Símbolo del Sistema (CMD)", td_bold), Paragraph("<code>start.bat</code>", code_style), Paragraph("Siembra base de datos, levanta Backend (8000) y Frontend (5173), y abre navegador.", td_style)],
        [Paragraph("PowerShell", td_bold), Paragraph("<code>.\\start.ps1</code>", code_style), Paragraph("Ejecuta rutina automatizada con política de ejecución local e inicio simultáneo.", td_style)],
    ]
    t_cmd = Table(cmd_data, colWidths=[120, 110, 310])
    t_cmd.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_secondary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_cmd)
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>2.3 Arranque Manual por Terminales:</b>", body_style))
    story.append(Paragraph("• <b>Terminal 1 (Backend FastAPI):</b> <code>python src/backend/seed.py</code> &nbsp;|&nbsp; <code>python -m uvicorn src.backend.main:app --port 8000 --reload</code> (Swagger interactivo en <code>http://127.0.0.1:8000/docs</code>)", bullet_style))
    story.append(Paragraph("• <b>Terminal 2 (Frontend Web):</b> <code>npm install --prefix src/frontend</code> &nbsp;|&nbsp; <code>npm run dev --prefix src/frontend</code> (App Web en <code>http://127.0.0.1:5173</code>)", bullet_style))
    story.append(Paragraph("• <b>Verificación de Pruebas:</b> <code>python -m pytest tests/ -v</code> certifica <b>38 de 38 pruebas aprobadas</b> en ~1.7 segundos.", bullet_style))
    story.append(Spacer(1, 6))

    # SECTION 3
    story.append(Paragraph("3. Control de Acceso, Roles y Credenciales de Demostración", h1_style))
    story.append(Paragraph(
        "El sistema incorpora autenticación criptográfica en <code>LoginView.jsx</code> y endpoints <code>/api/auth/login</code>, "
        "con contraseñas hasheadas en base de datos bajo PBKDF2/SHA-256. En la barra superior (<code>TopRoleBar.jsx</code>) se dispone "
        "de un selector dinámico para alternar roles sin fricción durante la sustentación:",
        body_style
    ))

    roles_data = [
        [Paragraph("<b>Rol</b>", th_style), Paragraph("<b>Credenciales Demo</b>", th_style), Paragraph("<b>Alcance Operativo y Permisos en el Sistema</b>", th_style)],
        [
            Paragraph("<b>Administrador</b>", td_bold),
            Paragraph("Usuario: <code>admin</code><br/>Clave: <code>admin123</code>", td_style),
            Paragraph("Control total: Aprobación de lotes, cuarentena preventiva de calidad (Incidencia Hora 12), balance económico (RF12), exportación CSV con BOM UTF-8 (RF11) y auditoría inmutable (RF10).", td_style)
        ],
        [
            Paragraph("<b>Operador</b>", td_bold),
            Paragraph("Usuario: <code>operador</code><br/>Clave: <code>operador123</code>", td_style),
            Paragraph("Registro en planta: Recepción con selector multi-unidad (RF01), registro de transformaciones con semáforo de merma (RF02/RF04) y visualización de inventario. Acciones administrativas bloqueadas con HTTP 403.", td_style)
        ],
        [
            Paragraph("<b>Comprador / Público</b>", td_bold),
            Paragraph("Sin credenciales<br/>(Acceso Abierto)", td_style),
            Paragraph("Transparencia B2B: Consulta de Pasaporte Digital QR (RF06), trazabilidad genealógica y cotización en el Catálogo B2B de Mermas (RF13). Costos internos y teléfonos personales estrictamente ocultos.", td_style)
        ]
    ]
    t_roles = Table(roles_data, colWidths=[85, 105, 350])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 6))

    # SECTION 4
    story.append(Paragraph("4. Guía de Demostración Vertical \"Happy Path\" (< 120 Segundos)", h1_style))
    story.append(Paragraph(
        "Protocolo secuencial diseñado para que el jurado evaluador certifique la totalidad de los requisitos funcionales "
        "<b>(RF01 a RF13)</b> en menos de dos minutos:",
        body_style
    ))

    # Timeline table
    timeline_data = [
        [Paragraph("<b>Ventana</b>", th_style), Paragraph("<b>Paso de Demostración</b>", th_style), Paragraph("<b>Requisitos Evaluados</b>", th_style), Paragraph("<b>Evidencia Concreta Observada</b>", th_style)],
        [Paragraph("0:00 - 0:20", td_bold), Paragraph("1. Recepción Multi-Unidad", td_style), Paragraph("RF01, RF08", td_bold), Paragraph("Recepción en Rivera (sacos a kg), validación NTC 1252 y alta en bodega.", td_style)],
        [Paragraph("0:20 - 0:45", td_bold), Paragraph("2. Transformación y Merma", td_style), Paragraph("RF02, RF04, RF08, RF12", td_bold), Paragraph("Lote CAC001 (100kg entrada / 80kg salida): Merma 20%, semáforo rojo, justificación obligatoria y cascarilla circular.", td_style)],
        [Paragraph("0:45 - 1:00", td_bold), Paragraph("3. Trazabilidad Genealógica", td_style), Paragraph("RF03", td_bold), Paragraph("Reconstrucción punta a punta de CAC001 en < 3 ms con árbol de origen y proceso.", td_style)],
        [Paragraph("1:00 - 1:15", td_bold), Paragraph("4. Seguridad RBAC y Hora 12", td_style), Paragraph("RF09", td_bold), Paragraph("Prueba 403 a Operador + Bloqueo administrativo de CAC001 por reporte de calidad.", td_style)],
        [Paragraph("1:15 - 1:30", td_bold), Paragraph("5. Auditoría y Exportación CSV", td_style), Paragraph("RF10, RF11", td_bold), Paragraph("Log inmutable en UTC-5 con triggers SQLite + CSV con BOM UTF-8 y sanitización CWE-1236.", td_style)],
        [Paragraph("1:30 - 1:45", td_bold), Paragraph("6. Pasaporte QR Sanitizado", td_style), Paragraph("RF06", td_bold), Paragraph("QR vectorial SVG offline, banner de retención en CAC001, cero fuga de costos y marco móvil 375px.", td_style)],
        [Paragraph("1:45 - 2:00", td_bold), Paragraph("7. Catálogo Industrial B2B", td_style), Paragraph("RF13 / HU-13", td_bold), Paragraph("Venta de cascarilla por kilo ($14.500-$16.500), folio inmutable y deslinde de no manufactura B2C.", td_style)],
        [Paragraph("2:00 - 2:10", td_bold), Paragraph("8. Respaldo y Recuperación", td_style), Paragraph("RF07", td_bold), Paragraph("Instantánea física en caliente en 15.68 ms y restauración íntegra en 18.19 ms.", td_style)]
    ]
    t_timeline = Table(timeline_data, colWidths=[65, 120, 100, 255])
    t_timeline.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_secondary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 3.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_timeline)
    story.append(Spacer(1, 6))

    # Detailed steps
    story.append(Paragraph("<b>PASO A PASO DETALLADO:</b>", h2_style))

    story.append(Paragraph("<b>PASO 1: Recepción de Lotes con Conversión Multi-Unidad (RF01)</b>", h2_style))
    story.append(Paragraph(
        "1. Con el rol <b>Operador</b>, abra la pestaña <i>'1. Recepción & Acopio'</i>.<br/>"
        "2. Ingrese: Lote <code>CAC004</code> | Municipio <code>Rivera</code> | Vereda <code>El Salado - Finca La Esperanza</code> | Productor <code>Carlos Julio Fierro</code>.<br/>"
        "3. En <i>Unidad de Medida</i> elija <code>Sacos (50 kg)</code> e ingrese <code>2.4</code>. El sistema convierte en tiempo real a <b>120.00 kg netos</b>.<br/>"
        "4. Ingrese Humedad <code>7.20%</code> (badge verde: <i>Cumple NTC 1252 ≤ 7.5%</i>), Fermentación <code>80.00%</code> (badge verde: <i>Excelente Sabor ≥ 75%</i>), Precio Compra <code>$ 16.500 COP/kg</code>.<br/>"
        "5. Presione <i>'Registrar Recepción de Lote'</i>. <b>Resultado:</b> El lote queda en bodega con 120.00 kg disponibles y estado inicial <code>PENDIENTE</code>.",
        body_style
    ))

    story.append(Paragraph("<b>PASO 2: Transformación, Semáforo de Merma (20%) y Cascarilla (RF02, RF04, RF08, RF12)</b>", h2_style))
    story.append(Paragraph(
        "1. Pase a la pestaña <i>'2. Transformación & Merma'</i> y seleccione el lote canónico oficial <b><code>CAC001</code></b> (100.00 kg disponibles).<br/>"
        "2. Diligencie: Etapa <code>Tostión y Molienda</code> | Responsable <code>Ing. Andrés Gómez</code> | Entrada <code>100.00 kg</code> | Salida Vendible <code>80.00 kg</code> | Costo Etapa <code>$ 1.600.000,00 COP</code> | Precio Venta <code>$ 25.000,00 COP/kg</code>.<br/>"
        "3. <b>Disparo del Semáforo Rojo (RF04):</b> El sistema computa merma = <b>20.00%</b>. Al superar el 15.0%, el semáforo cambia a rojo intermitente y el botón de guardado se bloquea hasta redactar justificación (≥ 10 caracteres). Ingrese: <i>'Exceso de humedad relativa ambiental en Rivera durante secado solar'</i>.<br/>"
        "4. <b>Métricas Agroindustriales (RF05, RF12):</b> Costo Unitario Primario = <b>$ 20.000,00 COP/kg</b> ($1.600.000 / 80 kg) | Margen Comercial = <b>20.00%</b> | Cascarilla Circular = <b>20.00 kg</b> ($60.000 COP a $3.000/kg).<br/>"
        "5. Presione <i>'Guardar Transformación'</i>. <b>Resultado:</b> Stock de CAC001 baja atómicamente a 0.00 kg y se vincula la salida <code>SAL-CAC001-01</code>.",
        body_style
    ))

    story.append(Paragraph("<b>PASO 3: Consulta de Trazabilidad Genealógica Punta a Punta (RF03)</b>", h2_style))
    story.append(Paragraph(
        "Abra la pestaña <i>'Trazabilidad'</i> y seleccione <code>CAC001</code>. En <b>menos de 3 milisegundos</b> se visualiza el árbol genealógico completo: "
        "Finca de Rivera (humedad 7.5%, fermentación 76%) → Transformación (Tostión y Molienda, merma 20%, responsable) → Salida de producto terminado vinculada.",
        body_style
    ))

    story.append(Paragraph("<b>PASO 4: Prueba de Seguridad RBAC 403 y Bloqueo Incidencia Hora 12 (RF09)</b>", h2_style))
    story.append(Paragraph(
        "1. Con rol <b>Operador</b>, presione <i>'Probar Acceso Denegado (Test 403)'</i>. Se recibe rechazo estricto: <code>HTTP 403 Forbidden - Solo el Administrador puede ejecutar esta acción</code>.<br/>"
        "2. Cambie a rol <b>Administrador</b>, abra <i>'3. Admin & Control Calidad'</i> y en la fila de <code>CAC001</code> haga clic en <i>'Bloquear'</i>.<br/>"
        "3. Diligencie el motivo de la Incidencia Hora 12: <i>'Retención preventiva de calidad por reporte de humedad irregular'</i> y confirme. <b>Resultado:</b> Estado pasa a <code>BLOQUEADO</code>.",
        body_style
    ))

    story.append(Paragraph("<b>PASO 5: Auditoría Inmutable (RF10) y Exportación CSV Sanitizada (RF11)</b>", h2_style))
    story.append(Paragraph(
        "1. En <i>'5. Auditoría Inmutable'</i> se constata la fila de bloqueo con timestamp COT (UTC-5), usuario <code>admin</code> y motivo. Los triggers nativos de SQLite abortan cualquier sentencia UPDATE/DELETE.<br/>"
        "2. En <i>'Admin'</i> presione <i>'Exportar CSV (BOM utf-8-sig)'</i>. El archivo descargado abre en Excel con tildes impecables y sanitización anti-inyección CWE-1236 (anteponiendo comilla simple a caracteres <code>=</code>, <code>+</code>, <code>-</code>, <code>@</code>).",
        body_style
    ))

    story.append(Paragraph("<b>PASO 6: Pasaporte Digital QR Sanitizado y Simulador Móvil 375px (RF06)</b>", h2_style))
    story.append(Paragraph(
        "En <i>'4. Pasaporte Digital QR'</i>, <code>CAC001</code> exhibe banner de retención de calidad (no exportable). Al seleccionar <code>CAC002</code> (Liberado) "
        "se visualiza el QR vectorial SVG offline con atributos botánicos y sello NTC 1252. <b>El payload no contiene costos, márgenes ni teléfonos privados.</b> "
        "Al presionar <i>'Simular Escaneo Móvil'</i> se encuadra en marco de 375px y permite copiar la orden B2B en modo offline.",
        body_style
    ))

    story.append(Paragraph("<b>PASO 7: Catálogo Industrial & Botánico B2B de Mermas y Cotización Offline (RF13)</b>", h2_style))
    story.append(Paragraph(
        "En <i>'Catálogo B2B de Mermas'</i> se ofrece cascarilla tostada por kilo ($14.500-$16.500 COP/kg) para biofertilizantes y cosmética, con deslinde explícito "
        "de que TrazaCao suministra biomasa y no compite elaborando bienes terminados B2C. Al radicar cotización se genera un **Folio Único Inmutable**.",
        body_style
    ))

    story.append(Paragraph("<b>PASO 8: Respaldo y Restauración en Caliente en Milisegundos (RF07)</b>", h2_style))
    story.append(Paragraph(
        "Ejecute en terminal: <code>python datos/backup.py</code> (snapshot generado en <b>15.68 ms</b> con SHA-256) y <code>python datos/restore.py</code> "
        "(restauración íntegra y verificación en <b>18.19 ms</b>).",
        body_style
    ))
    story.append(Spacer(1, 6))

    # SECTION 5
    story.append(Paragraph("5. Guía de Resolución de Incidencias (Troubleshooting)", h1_style))
    
    tb_data = [
        [Paragraph("<b>Síntoma o Error</b>", th_style), Paragraph("<b>Causa Probable</b>", th_style), Paragraph("<b>Procedimiento de Solución Inmediata</b>", th_style)],
        [
            Paragraph("Puerto 8000 o 5173 ocupado", td_bold),
            Paragraph("Instancia huérfana en segundo plano.", td_style),
            Paragraph("PowerShell: <code>Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force</code>", code_style)
        ],
        [
            Paragraph("Base con datos inconsistentes", td_bold),
            Paragraph("Inserciones de prueba previas.", td_style),
            Paragraph("Restablecer datos oficiales canónicos: <code>python src/backend/seed.py</code>", code_style)
        ],
        [
            Paragraph("Error <code>database is locked</code>", td_bold),
            Paragraph("Concurrencia alta en SQLite.", td_style),
            Paragraph("El sistema activa <code>WAL</code> y <code>busy_timeout=5000</code>. Reiniciar uvicorn si el descriptor quedó abierto.", td_style)
        ],
    ]
    t_tb = Table(tb_data, colWidths=[110, 110, 320])
    t_tb.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_tb)
    story.append(Spacer(1, 6))

    # SECTION 6
    story.append(Paragraph("6. Declaración de Inteligencia Artificial y Gobernanza (Numeral 4)", h1_style))
    story.append(Paragraph(
        "En cumplimiento del <b>Numeral 4 del Reglamento Técnico de la Hackathon</b> y la política de transparencia institucional de la USCO:<br/>"
        "• <b>Herramientas Asistentes:</b> Gemini 2.5 Pro y Claude 3.5 Sonnet bajo el entorno agentic Antigravity.<br/>"
        "• <b>Autonomía Determinista:</b> Cero dependencias de APIs externas de IA en tiempo de ejecución; el sistema opera 100% offline.<br/>"
        "• <b>Supervisión Humana:</b> Cada componente, fórmula matemática y política de base de datos fue validado empíricamente mediante <b>38 pruebas automatizadas en pytest</b>.",
        body_style
    ))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] PDF generado exitosamente en: {output_path}")

if __name__ == "__main__":
    generar_pdf_e04()
