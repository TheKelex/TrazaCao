import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
import pypdf
import pypdfium2 as pdfium

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
        # Top banner accent line
        self.setFillColor(colors.HexColor("#1B3B2B"))
        self.rect(36, 756, 540, 2.5, fill=True, stroke=False)
        
        # Header text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1B3B2B"))
        self.drawString(36, 762, "TRAZACAO (CACAOTRACE HUILA) — REPORTE EJECUTIVO DE AVANCE TÉCNICO")
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(576, 762, "II HACKATHON DEVURITY · USCO 2026")

        # Bottom footer line
        self.setFillColor(colors.HexColor("#CBD5E1"))
        self.rect(36, 36, 540, 0.8, fill=True, stroke=False)

        # Footer text
        self.setFont("Helvetica", 7.2)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 25, "TrazaCao Huila — Trazabilidad Agroindustrial con Historia y Valor | Síntesis de Avance y Roadmap 100% Digital")
        
        page_str = f"Página {self._pageNumber} de {total_pages}"
        self.drawRightString(576, 25, page_str)
        self.restoreState()

def build_pdf(filename="Sintesis_Primeras_12_Horas_TrazaCao.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=38
    )

    styles = getSampleStyleSheet()

    # Color Palette - Forest & Amber Cacao Editorial Theme
    c_primary = colors.HexColor("#1B3B2B")     # Deep forest green
    c_secondary = colors.HexColor("#2D6A4F")   # Emerald deep green
    c_accent = colors.HexColor("#B45309")      # Warm amber
    c_dark = colors.HexColor("#0F172A")        # Slate 900
    c_muted = colors.HexColor("#334155")       # Slate 700
    c_border = colors.HexColor("#CBD5E1")      # Slate 300
    c_card_bg = colors.HexColor("#F8FAFC")     # Slate 50
    c_alert_bg = colors.HexColor("#FFFBEB")    # Amber 50
    c_alert_border = colors.HexColor("#F59E0B")# Amber 500
    c_alert_text = colors.HexColor("#92400E")  # Amber 800

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=16.5,
        textColor=c_primary,
        spaceAfter=1
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_accent,
        spaceAfter=3
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.2,
        textColor=c_muted,
        spaceAfter=4
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.0,
        leading=11.2,
        textColor=c_primary,
        spaceBefore=4,
        spaceAfter=2
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.4,
        leading=9.5,
        textColor=c_dark,
        spaceAfter=2
    )

    callout_body = ParagraphStyle(
        'CalloutBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.1,
        leading=9.1,
        textColor=c_alert_text
    )

    link_box_body = ParagraphStyle(
        'LinkBoxBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.8,
        leading=8.6,
        textColor=c_dark
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.8,
        leading=8.0,
        textColor=colors.white,
        alignment=1
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.2,
        leading=7.6,
        textColor=c_dark
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.2,
        leading=7.6,
        textColor=c_dark
    )

    table_cell_center = ParagraphStyle(
        'TableCellCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.2,
        leading=7.6,
        textColor=c_dark,
        alignment=1
    )

    rf_badge_pass = ParagraphStyle(
        'BadgePass',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.0,
        leading=7.2,
        textColor=colors.HexColor("#15803D"),
        alignment=1
    )

    rf_badge_pend = ParagraphStyle(
        'BadgePend',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.0,
        leading=7.2,
        textColor=colors.HexColor("#B45309"),
        alignment=1
    )

    story = []

    # =========================================================================
    # PAGE 1: ARQUITECTURA, DOMINIO Y NÚCLEO DE INGENIERÍA (HORAS 00:00 - 06:00)
    # =========================================================================
    story.append(Paragraph("SÍNTESIS DE AVANCE TÉCNICO Y ROADMAP: PRIMERAS 12 HORAS", title_style))
    story.append(Paragraph("PROYECTO TRAZACAO (CACAOTRACE HUILA) — TRAZABILIDAD AGROINDUSTRIAL CON HISTORIA Y VALOR", subtitle_style))
    story.append(Paragraph("<b>Certamen:</b> II Hackathon DEVURITY · Universidad Surcolombiana (USCO) | <b>Equipo 1:</b> TrazaCao Huila | <b>Fecha:</b> 15-16 Octubre 2026 | <b>Estado:</b> MVP 100% Funcional y Verificado", meta_style))

    # Strategic Notice Box (Documentation Status Callout)
    notice_text = (
        "<b>ESTADO DE LA DOCUMENTACIÓN Y ENFOQUE ESTRATÉGICO:</b><br/>"
        "Debido a la intensidad, exigencia y naturalidad del ciclo de desarrollo ágil durante las primeras 12 horas de hackathon, "
        "el equipo tomó la decisión deliberada de <b>priorizar la ingeniería del software, la precisión de las reglas de negocio agroindustriales y la resolución de pruebas de regresión</b>. "
        "Por tal motivo, la elaboración documental formal se encuentra <b>temporalmente frenada hasta contar con un MVP completo, estable y verificado al 100%</b>, "
        "garantizando que la documentación posterior no sea teórica, sino fiel reflejo del producto real. "
        "Los análisis de problema, diseño preliminar y contratos API iniciales (E01 a E03) se encuentran registrados en el repositorio documental oficial y se actualizarán a plenitud a partir de este hito."
    )
    notice_table = Table([[Paragraph(notice_text, callout_body)]], colWidths=[540])
    notice_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_alert_bg),
        ('BOX', (0, 0), (-1, -1), 1, c_alert_border),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(notice_table)
    story.append(Spacer(1, 3))

    # Repositories & Traceability Links
    links_data = [
        [
            Paragraph("<b>Repositorio del Proyecto (Código Fuente y Trazabilidad de Commits):</b><br/>"
                      "<font color='#1D4ED8'><u><a href='https://github.com/TheKelex/TrazaCao.git'>https://github.com/TheKelex/TrazaCao.git</a></u></font><br/>"
                      "<i>Permite auditar el historial de 20+ commits, ramas (develop, feature) y pruebas automatizadas.</i>", link_box_body),
            Paragraph("<b>Repositorio de Documentación (Avances Iniciales E01 a E10):</b><br/>"
                      "<font color='#1D4ED8'><u><a href='https://github.com/josephchurta2009-arch/Docs-E01-E010'>https://github.com/josephchurta2009-arch/Docs-E01-E010</a></u></font><br/>"
                      "<i>Contiene la formulación del problema (E01), 12 historias Gherkin (E02) y contratos API.</i>", link_box_body),
        ]
    ]
    links_table = Table(links_data, colWidths=[270, 270])
    links_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 0.6, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.6, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(links_table)
    story.append(Spacer(1, 3))

    # Section 1: Methodology & SDD Governance
    story.append(Paragraph("1. Metodología de Gobierno Ágil y Planificación SDD (Horas 00:00 – 03:00)", h1_style))
    sec1_text = (
        "• <b>Specification-Driven Development (SDD):</b> Disciplina estricta donde ninguna línea de código se produjo sin un plan técnico previo aprobado bajo la <i>Definition of Ready (DoR)</i>.<br/>"
        "• <b>Estructuración del Alcance (E01 / E02):</b> 12 Historias de Usuario bajo formato Gherkin (<i>Dado / Cuando / Entonces</i>) cubriendo desde recepción de grano hasta pasaporte QR público y auditoría inmutable.<br/>"
        "• <b>Gobierno Kanban y Separación de Roles:</b> Tablero Kanban con límite estricto WIP (máximo 1 tarea activa por desarrollador). Distribución técnica: <b>Dev 1</b> (Dominio Core y Matemáticas), <b>Dev 2</b> (Infraestructura, SQLite WAL y Seguridad), <b>Dev 3</b> (Frontend Móvil/Admin) y <b>Dev 4</b> (Pasaporte QR, Usabilidad y Modelo Comercial)."
    )
    story.append(Paragraph(sec1_text, body_style))
    story.append(Spacer(1, 3))

    # Section 2: Core Domain & Calculations
    story.append(Paragraph("2. Dominio Agroindustrial Puro y Blindaje Numérico con Decimal (Horas 03:00 – 05:00)", h1_style))
    sec2_text = (
        "• <b>Arquitectura Cebolla (Onion Architecture):</b> Aislamiento absoluto de las reglas de negocio en <code>domain/calculos.py</code>, libre de dependencias de frameworks web (FastAPI) o motores ORM (SQLAlchemy).<br/>"
        "• <b>Precisión Financiera con Python Decimal:</b> Se desterró el uso de punto flotante binario (<code>float</code>) para evitar discrepancias en pesajes y liquidaciones. Redondeo bancario estricto (<code>ROUND_HALF_UP</code>) a 2 decimales.<br/>"
        "• <b>Blindaje contra Divisiones por Cero:</b> Manejo exhaustivo y probado de 3 condiciones límite (<code>entrada == 0</code>, <code>salida_vendible == 0</code> y <code>precio_venta == 0</code>), garantizando 0.00% y cero caídas de servidor.<br/>"
        "• <b>Validación Agroindustrial Oficial (Caso Base CAC001):</b> 100 kg entrada grano seco &rarr; 80 kg salida vendible &rarr; Merma de proceso del 20.0% (disparo automático de alerta roja por superar el 15.0% normativo), costo unitario exacto de $20.000 COP/kg, margen comercial del 20.0% y valorización circular de cascarilla a $3.000 COP/kg."
    )
    story.append(Paragraph(sec2_text, body_style))
    story.append(Spacer(1, 3))

    # Section 3: Concurrency, Storage & Security
    story.append(Paragraph("3. Persistencia SQLite WAL, Concurrencia e Inmutabilidad de Auditoría (Horas 05:00 – 06:30)", h1_style))
    sec3_text = (
        "• <b>SQLite en Modo WAL (Write-Ahead Logging):</b> Configuración para alta concurrencia en puntos de acopio rurales mediante <code>PRAGMA journal_mode=WAL</code> y <code>PRAGMA busy_timeout=5000</code>, eliminando la necesidad de motores externos pesados.<br/>"
        "• <b>Triggers Nativos DDL de Inmutabilidad (RF10):</b> Creación de triggers en SQL nativo sobre <code>audit_logs</code> (<code>BEFORE UPDATE</code> y <code>BEFORE DELETE</code>) con <code>RAISE(ABORT)</code>, garantizando no repudio y trazabilidad inalterable.<br/>"
        "• <b>Consumo Atómico de Stock e Idempotencia (RF08):</b> Descuento seguro de inventario mediante <code>UPDATE lotes SET kg_disponibles = kg_disponibles - :consumo WHERE id = :id AND kg_disponibles &gt;= :consumo</code>, neutralizando condiciones de carrera. Soporte de cabecera <code>X-Idempotency-Key</code> (UUIDv4) contra duplicaciones de red.<br/>"
        "• <b>Control de Acceso Basado en Roles (RBAC):</b> Dependencia de seguridad que rechaza automáticamente con <code>HTTP 403 Forbidden</code> intentos no autorizados de alterar estados de calidad de lotes."
    )
    story.append(Paragraph(sec3_text, body_style))
    story.append(Spacer(1, 3))

    # Architecture Decision Records (ADRs) Summary Box
    adr_text = (
        "<b>DECISIONES ARQUITECTURALES CLAVE (ADRs):</b><br/>"
        "<b>ADR-01 (Persistencia Resiliente):</b> SQLite en modo WAL + Triggers SQL nativos &rarr; Portabilidad 100% offline, cero latencia de red y autoprotección DDL.<br/>"
        "<b>ADR-02 (Cálculo Financiero Exacto):</b> Aritmética <code>Decimal</code> frente a <code>float</code> &rarr; Elimina errores de redondeo en liquidación económica y balance de masas.<br/>"
        "<b>ADR-03 (Pasaporte QR Autónomo):</b> QR vectorial generado en cliente (<code>qrcode.react</code>) &rarr; Blindaje 100% resiliente en zonas rurales sin internet."
    )
    adr_table = Table([[Paragraph(adr_text, body_style)]], colWidths=[540])
    adr_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.6, c_secondary),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(adr_table)

    # Page 1 Break
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: FRONTEND MVP, VALIDACIÓN 1 A 1, COMMITS, ROADMAP DIGITAL Y CIERRE
    # =========================================================================
    story.append(Paragraph("4. Construcción del Frontend MVP y Pasaporte Digital QR (Horas 06:30 – 09:30)", h1_style))
    sec4_text = (
        "• <b>Single Page Application (React 19 + Vite + Tailwind CSS):</b> Arquitectura modular (< 1.2s build) optimizada para dispositivos móviles de operarios en acopio y pantallas de escritorio administrativas.<br/>"
        "• <b>Módulo Operador de Planta:</b> Formularios de Recepción (RF01) y Transformación (RF02) con semáforo dinámico de mermas (verde &le; 15%, rojo pulsante &gt; 15% con justificación obligatoria) y prevención reactiva de sobreconsumo.<br/>"
        "• <b>Panel Administrador:</b> Balance de bodegas por municipio (Rivera, Campoalegre, Algeciras), modal de bloqueo preventivo con motivo mínimo de 10 caracteres (RF09), historial inmutable de auditoría y exportación a CSV con UTF-8 BOM.<br/>"
        "• <b>Pasaporte Digital de Cacao (RF06):</b> Generador de QR en SVG local (<code>qrcode.react</code>). Vista pública que certifica origen Huila, variedad y trazabilidad, ocultando estrictamente costos internos y teléfonos privados de productores."
    )
    story.append(Paragraph(sec4_text, body_style))
    story.append(Spacer(1, 2.5))

    story.append(Paragraph("5. Auditoría de Requisitos (E05), Pruebas y Desempeño (Horas 09:30 – 12:00)", h1_style))
    sec5_text = (
        "• <b>Testeo Cruzado 1 a 1 y Remediación en Caliente:</b> Corrección de rutas 404 (pasaporte y CSV), inclusión de selector de Responsable y mapeo normalizado (error 422 resuelto), sincronización horaria local (<code>America/Bogota</code> / UTC-5) y enriquecimiento de campos bajo NTC 1252.<br/>"
        "• <b>Suite de 15 Pruebas Pytest (100% pasando):</b> Validación de mermas, control de stock, seguridad RBAC (rechazo 403) y regresión de Hora 12.<br/>"
        "• <b>Métricas de Operación y Rendimiento:</b> Respaldo en <b>15.68 ms</b>, restauración en <b>18.19 ms</b> y trazabilidad de 100 registros en <b>0.58 ms</b> (&lt; 3.0 s meta)."
    )
    story.append(Paragraph(sec5_text, body_style))
    story.append(Spacer(1, 2.5))

    # Section 6: Commit Traceability Table
    story.append(Paragraph("6. Traza Cronológica de Commits en GitHub (Primeras 12 Horas de Sprint)", h1_style))
    commit_rows = [
        [
            Paragraph("Hash", table_header),
            Paragraph("Hora", table_header),
            Paragraph("Componente", table_header),
            Paragraph("Mensaje del Commit y Alcance Técnico", table_header)
        ],
        [
            Paragraph("<code>e79fe9d</code>", table_cell_bold),
            Paragraph("14:17", table_cell_center),
            Paragraph("Repositorio Base", table_cell),
            Paragraph("Inicialización de la estructura base del proyecto TrazaCao Huila.", table_cell)
        ],
        [
            Paragraph("<code>239fd21</code>", table_cell_bold),
            Paragraph("18:30", table_cell_center),
            Paragraph("Docs / SDD", table_cell),
            Paragraph("Especificación de diseño E03, requisitos Gherkin E02, contratos de API JSON.", table_cell)
        ],
        [
            Paragraph("<code>96679a8</code>", table_cell_bold),
            Paragraph("18:34", table_cell_center),
            Paragraph("Kanban Board", table_cell),
            Paragraph("Tablero Kanban con políticas DoR/DoD y tareas de ideación técnica por desarrollador.", table_cell)
        ],
        [
            Paragraph("<code>ee7f37b</code>", table_cell_bold),
            Paragraph("20:48", table_cell_center),
            Paragraph("Backend Core", table_cell),
            Paragraph("Motor de cálculo agroindustrial con Decimal, control de división por cero y pruebas.", table_cell)
        ],
        [
            Paragraph("<code>83a10f6</code>", table_cell_bold),
            Paragraph("20:48", table_cell_center),
            Paragraph("Infra / Database", table_cell),
            Paragraph("Persistencia SQLite modo WAL, modelos ORM y triggers DDL de inmutabilidad.", table_cell)
        ],
        [
            Paragraph("<code>196598e</code>", table_cell_bold),
            Paragraph("20:48", table_cell_center),
            Paragraph("Services / Stock", table_cell),
            Paragraph("Consumo atómico condicional de inventario y cabecera de idempotencia UUIDv4.", table_cell)
        ],
        [
            Paragraph("<code>3c95854</code>", table_cell_bold),
            Paragraph("20:48", table_cell_center),
            Paragraph("API / Routers", table_cell),
            Paragraph("Routers modulares de lotes, transformaciones, pasaporte QR y exportación CSV.", table_cell)
        ],
        [
            Paragraph("<code>35387cd</code>", table_cell_bold),
            Paragraph("20:48", table_cell_center),
            Paragraph("QA / Tests", table_cell),
            Paragraph("Suite de 15 pruebas automatizadas pasando y prueba de regresión de Hora 12.", table_cell)
        ],
        [
            Paragraph("<code>32117e1</code>", table_cell_bold),
            Paragraph("23:34", table_cell_center),
            Paragraph("Backend Ops", table_cell),
            Paragraph("Scripts de backup, restore y benchmark de 100 registros (< 20 ms de latencia).", table_cell)
        ],
        [
            Paragraph("<code>57273a9</code>", table_cell_bold),
            Paragraph("23:46", table_cell_center),
            Paragraph("Frontend MVP", table_cell),
            Paragraph("Interfaz SPA completa, offline, pasaporte digital QR y manual de usuario E04.", table_cell)
        ],
        [
            Paragraph("<code>8ff915c</code>", table_cell_bold),
            Paragraph("23:54", table_cell_center),
            Paragraph("IA & Ética", table_cell),
            Paragraph("Inventario de prompts, skills y declaración ética de IA (numeral 4 reglamento).", table_cell)
        ],
        [
            Paragraph("<code>1d114b5</code>", table_cell_bold),
            Paragraph("01:01", table_cell_center),
            Paragraph("QA / Remediación", table_cell),
            Paragraph("Informe E05 testeo 1 a 1, corrección rutas 404, validación responsable y balance.", table_cell)
        ],
    ]
    commit_table = Table(commit_rows, colWidths=[42, 36, 82, 380])
    commit_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.0),
        ('TOPPADDING', (0, 0), (-1, -1), 1.0),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.4, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_card_bg]),
    ]))
    story.append(commit_table)
    story.append(Spacer(1, 2.5))

    # Section 7: Current Fulfillment vs Pending Points (Roadmap 100% Digital)
    story.append(Paragraph("7. Matriz de Cumplimiento (RF01-RF12) y Roadmap de Puntos Pendientes", h1_style))
    
    # 2-Row Compact RF Status
    rf_matrix_data = [
        [
            Paragraph("RF01: Recepción", table_cell_bold),
            Paragraph("RF02: Transformación", table_cell_bold),
            Paragraph("RF03: Trazabilidad", table_cell_bold),
            Paragraph("RF04: Alerta Merma", table_cell_bold),
            Paragraph("RF05: Margen Costo", table_cell_bold),
            Paragraph("RF06: Pasaporte QR", table_cell_bold),
            Paragraph("RF07: Persist. WAL", table_cell_bold),
            Paragraph("RF08: Stock Atómico", table_cell_bold),
            Paragraph("RF09: Gestión Estado", table_cell_bold),
            Paragraph("RF10: Auditoría Inm.", table_cell_bold),
            Paragraph("RF11: Exportar CSV", table_cell_bold),
            Paragraph("RF12: Balance Rob.", table_cell_bold),
        ],
        [
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
            Paragraph("✔ Cumplido", rf_badge_pass),
        ]
    ]
    rf_matrix_table = Table(rf_matrix_data, colWidths=[45]*12)
    rf_matrix_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 0.5, c_secondary),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, c_border),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.2),
    ]))
    story.append(rf_matrix_table)
    story.append(Spacer(1, 2.5))

    # Detailed Pending Points Table / Roadmap (100% Digital / No Physical Devices)
    roadmap_data = [
        [
            Paragraph("<b>Eje de Trabajo</b>", table_header),
            Paragraph("<b>Puntos Específicos Pendientes por Desarrollar / Próximos Pasos (100% Digital)</b>", table_header),
            Paragraph("<b>Estado / Meta</b>", table_header)
        ],
        [
            Paragraph("<b>Entregables de Documentación Formal</b>", table_cell_bold),
            Paragraph("• <b>E06 (Verificación de Usabilidad Externa UX):</b> Ejecución de pruebas con usuario real ajeno al equipo en Oasis Plaza; medición de tiempos de registro (< 45s), consulta QR (< 20s) y cálculo de índice SUS.<br/>"
                      "• <b>E07 (Operación y Despliegue):</b> Formalizar guía de puesta en marcha en Linux/Windows y automatización de cron de backup.<br/>"
                      "• <b>E09 (Pitch Comercial & Piloto):</b> Maquetación final de las 5 diapositivas del Pitch de 5 min y formalización del contrato del piloto comercial de 30 días ($1.200.000 COP) para asociaciones cacaoteras del Huila.<br/>"
                      "• <b>E10 (Matriz de Entrega):</b> Sincronización final de todos los entregables en <code>Docs-E01-E010</code>.", table_cell),
            Paragraph("<b>Fase Inmediata</b><br/>(Reactivada tras consolidar MVP)", rf_badge_pend)
        ],
        [
            Paragraph("<b>Capacidades Técnicas y Módulos Digitales</b>", table_cell_bold),
            Paragraph("• <b>PWA y Sincronización Nube Diferida (Background Sync):</b> Service Worker con base local en navegador (IndexedDB) para replicación digital automática hacia el servidor central cuando haya conectividad.<br/>"
                      "• <b>Módulo Digital de Calidad y Perfil de Taza:</b> Registro de variables organolépticas de catación (acidez, amargor, notas afrutadas/florales según norma NTC 1252) integradas en el Pasaporte QR público.<br/>"
                      "• <b>Módulo de Analítica y Reportes Avanzados (BI):</b> Dashboard de gráficos de rendimiento por vereda/municipio, series de mermas y balance económico consolidado exportable a Excel/PDF.<br/>"
                      "• <b>Validación Digital de Cumplimiento EUDR:</b> Integración de polígonos de geolocalización de parcelas para verificación digital contra deforestación exigida por la Unión Europea.", table_cell),
            Paragraph("<b>Roadmap Post-MVP</b><br/>(Evolución 100% Software)", rf_badge_pend)
        ]
    ]
    roadmap_table = Table(roadmap_data, colWidths=[105, 360, 75])
    roadmap_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_secondary),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.4, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_card_bg]),
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(roadmap_table)
    story.append(Spacer(1, 2.5))

    closing_text = (
        "<b>CONCLUSIÓN Y CIERRE DE AVANCES:</b> "
        "Con los <b>12 Requerimientos Funcionales (RF01 a RF12) implementados y probados al 100%</b>, el equipo consolida un MVP robusto, confiable y 100% digital. "
        "Habiendo asegurado el software en estas primeras 12 horas, <b>se reactiva la redacción formal de los entregables documentales (E06, E07, E09, E10)</b> en el repositorio documental oficial, "
        "garantizando la máxima calificación técnica y comercial ante el comité evaluador de la hackathon."
    )
    closing_table = Table([[Paragraph(closing_text, body_style)]], colWidths=[540])
    closing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 0.8, c_secondary),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(closing_table)

    # Build PDF with custom canvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generado: {filename}")

    # Verify Page Count
    reader = pypdf.PdfReader(filename)
    page_count = len(reader.pages)
    print(f"Total de páginas generadas: {page_count}")
    return page_count

if __name__ == "__main__":
    count = build_pdf()
    if count == 2:
        print("EXITO: El documento tiene exactamente 2 páginas.")
    else:
        print(f"ADVERTENCIA: El documento tiene {count} páginas.")
