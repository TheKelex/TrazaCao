"""
Generador de Reporte PDF del Tablero Kanban & Seguimiento SDD
Proyecto: CacaoTrace Huila / TrazaCao
Utiliza ReportLab para generar un PDF formal en orientación horizontal (Landscape)
con diseño agroindustrial profesional y métricas de avance.
"""

import sys
import os
from pathlib import Path
from datetime import datetime

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PDF = ROOT_DIR / "documentos" / "TABLERO_KANBAN_TRAZACAO.pdf"
ROOT_PDF = ROOT_DIR / "TABLERO_KANBAN_TRAZACAO.pdf"

# Paleta Agroindustrial Huila
CACAO_DARK = colors.HexColor("#1C130E")
CACAO_BROWN = colors.HexColor("#382218")
AMBER_ACCENT = colors.HexColor("#D97706")
AMBER_LIGHT = colors.HexColor("#FEF3C7")
EMERALD_ACCENT = colors.HexColor("#059669")
EMERALD_LIGHT = colors.HexColor("#D1FAE5")
SLATE_BG = colors.HexColor("#F8FAFC")
SLATE_BORDER = colors.HexColor("#E2E8F0")
TEXT_MUTED = colors.HexColor("#64748B")
TEXT_DARK = colors.HexColor("#0F172A")


def generar_pdf():
    # Página horizontal para acomodar la tabla ancha
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=landscape(letter),
        leftMargin=0.4 * inch,
        rightMargin=0.4 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
    )

    styles = getSampleStyleSheet()

    # Estilos tipográficos
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=18,
        textColor=CACAO_BROWN,
    )
    subtitle_style = ParagraphStyle(
        "SubTitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=TEXT_MUTED,
    )
    metric_label = ParagraphStyle(
        "MetricLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=CACAO_BROWN,
        alignment=1,
    )
    metric_val = ParagraphStyle(
        "MetricVal",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=15,
        textColor=EMERALD_ACCENT,
        alignment=1,
    )
    th_style = ParagraphStyle(
        "THStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )
    td_style = ParagraphStyle(
        "TDStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_DARK,
    )
    td_bold = ParagraphStyle(
        "TDBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=CACAO_BROWN,
    )
    status_done = ParagraphStyle(
        "StatusDone",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=8.5,
        textColor=EMERALD_ACCENT,
        alignment=1,
    )
    status_prog = ParagraphStyle(
        "StatusProg",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=8.5,
        textColor=AMBER_ACCENT,
        alignment=1,
    )
    status_backlog = ParagraphStyle(
        "StatusBacklog",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=8.5,
        textColor=TEXT_MUTED,
        alignment=1,
    )

    story = []

    # 1. ENCABEZADO INSTITUCIONAL
    header_data = [
        [
            Paragraph("<b>TRAZACAO HUILA — TABLERO KANBAN & SEGUIMIENTO SDD</b>", title_style),
            Paragraph(
                f"<b>Fecha de Corte:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')} COT<br/>"
                "<b>Repo:</b> github.com/TheKelex/TrazaCao (develop)",
                subtitle_style,
            ),
        ],
        [
            Paragraph(
                "II Hackathon de Programación DEVURITY — Universidad Surcolombiana (USCO) | Reto Agroindustria Cacao",
                subtitle_style,
            ),
            "",
        ],
    ]
    header_table = Table(header_data, colWidths=[5.5 * inch, 4.5 * inch])
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=AMBER_ACCENT, spaceBefore=2, spaceAfter=6))

    # 2. TARJETAS DE MÉTRICAS GLOBALES
    metrics_data = [
        [
            Paragraph("TOTAL TAREAS", metric_label),
            Paragraph("TERMINADAS (DoD)", metric_label),
            Paragraph("EN INTEGRACIÓN", metric_label),
            Paragraph("PENDIENTES (BACKLOG)", metric_label),
            Paragraph("TASA DE CUMPLIMIENTO", metric_label),
        ],
        [
            Paragraph("24", metric_val),
            Paragraph("21", metric_val),
            Paragraph("1", metric_val),
            Paragraph("2", metric_val),
            Paragraph("87.5%", metric_val),
        ],
    ]
    metrics_table = Table(metrics_data, colWidths=[2.0 * inch] * 5)
    metrics_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SLATE_BG),
                ("BOX", (0, 0), (-1, -1), 1, SLATE_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, SLATE_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(metrics_table)
    story.append(Spacer(1, 8))

    # 3. TABLA VIVA DEL TABLERO KANBAN
    # Columnas: ID, Entregable / Hito, Responsable, Estado Kanban, Evidencia / Ubicación
    tareas = [
        ("DOC-E01", "Comprensión del Problema y Marco MNTC", "Dev 4", "DONE (DoD)", "documentos/E01_problema.md"),
        ("DOC-E02", "12 Historias de Usuario Gherkin + Hora 12", "Dev 4", "DONE (DoD)", "documentos/E02_requisitos.md"),
        ("DOC-E03", "Arquitectura Onion, Diagramas ER y ADRs", "Dev 1 & 2", "DONE (DoD)", "documentos/E03_diseno.md"),
        ("DOC-API", "Contratos de API JSON Oficiales", "Dev 1", "DONE (DoD)", "documentos/CONTRATOS_API.md"),
        ("DOC-CTX", "Prompt Maestro de Alineación IA Swarm", "Dev 1", "DONE (DoD)", "CONTEXTO_IA_EQUIPO.md"),
        ("PLN-D1", "Plan Técnico Core, Matemáticas y Dominio", "Dev 1", "DONE (DoD)", "documentos/PLAN_DEV1_CORE.md"),
        ("PLN-D2", "Plan Seguridad, Triggers & Infra QA", "Dev 2", "DONE (DoD)", "documentos/PLAN_DEV2_INFRA_QA.md"),
        ("PLN-D3", "Plan Frontend Operador Móvil & Admin", "Dev 3", "DONE (DoD)", "documentos/PLAN_DEV3_FRONTEND.md"),
        ("PLN-D4", "Plan Ficha Comercial QR, Usabilidad & Pitch", "Dev 4", "DONE (DoD)", "documentos/PLAN_DEV4_COMERCIAL_UX.md"),
        ("COD-B01", "SQLite WAL, Concurrencia y Triggers DDL", "Dev 2", "DONE (DoD)", "src/backend/infra/database.py"),
        ("COD-B02", "Motor Decimal Agroindustrial (CAC001)", "Dev 1", "DONE (DoD)", "src/backend/domain/calculos.py"),
        ("COD-OPS", "Respaldo Atómico (15ms) y Restore (18ms)", "Dev 2", "DONE (DoD)", "datos/backup.py | restore.py"),
        ("COD-U01", "Frontend SPA Operador & Admin (React Vite)", "Dev 3", "DONE (DoD)", "src/frontend/ (Build en 2.0s)"),
        ("COD-U02", "Ficha QR SVG + Simulador Móvil 375px", "Dev 4", "DONE (DoD)", "src/frontend/PasaportePublico.jsx"),
        ("DOC-E04", "Manual de Usuario y Demo < 120s", "Dev 1 / Dev 3", "DONE (DoD)", "documentos/E04_manual.md"),
        ("DOC-E05", "Informe Testeo 1 a 1 de Requisitos MVP", "Equipo", "DONE (DoD)", "documentos/E05_TESTEO_EQUIPO..."),
        ("DOC-E08", "Bitácora IA, Skills y Prompts Literales", "Dev 1", "DONE (DoD)", "documentos/E08_IA_y_fuentes.md"),
        ("FIX-API", "Corrección de Rutas 404 (QR & Export CSV)", "Dev 1", "DONE (DoD)", "routers/pasaporte.py & export.py"),
        ("FIX-SCH", "Tolerancia Transformación (Responsable/Salida)", "Dev 1", "DONE (DoD)", "schemas.py & TransformacionView"),
        ("FIX-UX", "Ubicación Veredal y Horario Colombia COT", "Dev 1 & Dev 3", "DONE (DoD)", "RecepcionView & AuditLogView"),
        ("COD-RF12", "Panel Balance Agroindustrial Consolidado", "Dev 1", "DONE (DoD)", "AdminDashboard.jsx (RF12)"),
        ("INT-DEV2", "Integración Suite Seguridad Dev 2", "Dev 1 & Dev 2", "EN INTEGRACIÓN", "Rama feature/security-qa"),
        ("DOC-E06", "Informe de Usabilidad Externa en Stand", "Dev 4", "BACKLOG", "Asignado a Dev 4"),
        ("DOC-E09", "Propuesta Comercial y Diapositivas Pitch", "Dev 4", "BACKLOG", "Asignado a Dev 4"),
    ]

    table_rows = [
        [
            Paragraph("ID", th_style),
            Paragraph("Entregable / Requerimiento", th_style),
            Paragraph("Responsable", th_style),
            Paragraph("Estado Kanban", th_style),
            Paragraph("Evidencia / Ubicación en Repositorio", th_style),
        ]
    ]

    for tid, desc, resp, est, evid in tareas:
        if "DONE" in est:
            st_par = Paragraph(est, status_done)
        elif "INTEGRACIÓN" in est or "PROCESO" in est:
            st_par = Paragraph(est, status_prog)
        else:
            st_par = Paragraph(est, status_backlog)

        table_rows.append(
            [
                Paragraph(f"<b>{tid}</b>", td_bold),
                Paragraph(desc, td_style),
                Paragraph(resp, td_style),
                st_par,
                Paragraph(f"<font color='#0284c7'>{evid}</font>", td_style),
            ]
        )

    col_widths = [0.8 * inch, 3.4 * inch, 1.1 * inch, 1.4 * inch, 3.3 * inch]
    kanban_table = Table(table_rows, colWidths=col_widths, repeatRows=1)

    tstyle = [
        ("BACKGROUND", (0, 0), (-1, 0), CACAO_BROWN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOX", (0, 0), (-1, -1), 1, SLATE_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, SLATE_BORDER),
    ]

    # Filas alternas con sombreado suave
    for i in range(1, len(table_rows)):
        if i % 2 == 0:
            tstyle.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#F1F5F9")))
        else:
            tstyle.append(("BACKGROUND", (0, i), (-1, i), colors.white))

    kanban_table.setStyle(TableStyle(tstyle))
    story.append(kanban_table)

    # 4. NOTA AL PIE DE METODOLOGÍA
    story.append(Spacer(1, 6))
    footer_text = Paragraph(
        "<b>Gobernanza SDD:</b> Cada entregable catalogado como <i>DONE (DoD)</i> cuenta con especificación previa en <code>documentos/</code>, "
        "código commiteado en rama Git, pruebas verificadas y sincronización en <code>ENTREGA.md</code>. "
        "TrazaCao Huila © 2026 — Sede Oasis Plaza, Neiva, Huila.",
        subtitle_style,
    )
    story.append(footer_text)

    # Compilar PDF
    doc.build(story)

    # Copiar también a la raíz para fácil acceso
    import shutil
    shutil.copyfile(str(OUTPUT_PDF), str(ROOT_PDF))

    print(f"[OK] PDF generado exitosamente en:")
    print(f"     - {OUTPUT_PDF}")
    print(f"     - {ROOT_PDF}")


if __name__ == "__main__":
    generar_pdf()
