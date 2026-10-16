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
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=landscape(letter),
        leftMargin=0.4 * inch,
        rightMargin=0.4 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=17,
        textColor=CACAO_BROWN,
    )
    subtitle_style = ParagraphStyle(
        "SubTitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=TEXT_MUTED,
    )
    metric_label = ParagraphStyle(
        "MetricLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=CACAO_BROWN,
        alignment=1,
    )
    metric_val = ParagraphStyle(
        "MetricVal",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=14,
        textColor=EMERALD_ACCENT,
        alignment=1,
    )
    th_style = ParagraphStyle(
        "THStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
    )
    td_style = ParagraphStyle(
        "TDStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=TEXT_DARK,
    )
    td_bold = ParagraphStyle(
        "TDBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=CACAO_BROWN,
    )
    status_done = ParagraphStyle(
        "StatusDone",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=6.8,
        leading=8.2,
        textColor=EMERALD_ACCENT,
        alignment=1,
    )

    story = []

    # 1. ENCABEZADO
    header_data = [
        [
            Paragraph("<b>TRAZACAO HUILA — TABLERO KANBAN & SEGUIMIENTO SDD (100% COMPLETITUD)</b>", title_style),
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
    header_table = Table(header_data, colWidths=[6.0 * inch, 4.0 * inch])
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
    story.append(Spacer(1, 3))
    story.append(HRFlowable(width="100%", thickness=1.5, color=AMBER_ACCENT, spaceBefore=2, spaceAfter=5))

    # 2. TARJETAS DE MÉTRICAS
    metrics_data = [
        [
            Paragraph("TOTAL TAREAS", metric_label),
            Paragraph("TERMINADAS (DoD)", metric_label),
            Paragraph("EN INTEGRACIÓN", metric_label),
            Paragraph("PENDIENTES (BACKLOG)", metric_label),
            Paragraph("TASA DE CUMPLIMIENTO", metric_label),
        ],
        [
            Paragraph("28", metric_val),
            Paragraph("28", metric_val),
            Paragraph("0", metric_val),
            Paragraph("0", metric_val),
            Paragraph("100.0%", metric_val),
        ],
    ]
    metrics_table = Table(metrics_data, colWidths=[2.0 * inch] * 5)
    metrics_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SLATE_BG),
                ("BOX", (0, 0), (-1, -1), 1, SLATE_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, SLATE_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ]
        )
    )
    story.append(metrics_table)
    story.append(Spacer(1, 6))

    # 3. TABLA VIVA DEL TABLERO KANBAN
    tareas = [
        ("DOC-E01", "Comprensión del Problema y Marco MNTC", "Dev 4", "DONE (DoD)", "documentos/E01_problema.pdf"),
        ("DOC-E02", "13 Historias de Usuario Gherkin + Hora 12", "Dev 4", "DONE (DoD)", "documentos/E02_requisitos.pdf"),
        ("DOC-E03", "Arquitectura Onion, Diagramas ER y ADRs", "Dev 1 & 2", "DONE (DoD)", "documentos/E03_diseño.pdf"),
        ("DOC-API", "Contratos de API JSON Oficiales", "Dev 1", "DONE (DoD)", "documentos/CONTRATOS_API.md"),
        ("DOC-CTX", "Prompt Maestro de Alineación IA Swarm", "Dev 1", "DONE (DoD)", "CONTEXTO_IA_EQUIPO.md"),
        ("PLN-D1", "Plan Técnico Core, Matemáticas y Dominio", "Dev 1", "DONE (DoD)", "documentos/PLAN_DEV1_CORE.md"),
        ("PLN-D2", "Plan Seguridad, Triggers & Infra QA", "Dev 2", "DONE (DoD)", "documentos/PLAN_DEV2_INFRA_QA.md"),
        ("PLN-D3", "Plan Frontend Operador Móvil & Admin", "Dev 3", "DONE (DoD)", "documentos/PLAN_DEV3_FRONTEND.md"),
        ("PLN-D4", "Plan Ficha Comercial QR, Usabilidad & Pitch", "Dev 4", "DONE (DoD)", "documentos/PLAN_DEV4_COMERCIAL_UX.md"),
        ("COD-B01", "SQLite WAL, Concurrencia y Triggers DDL", "Dev 2", "DONE (DoD)", "src/backend/infra/database.py"),
        ("COD-B02", "Motor Decimal Agroindustrial (CAC001)", "Dev 1", "DONE (DoD)", "src/backend/domain/calculos.py"),
        ("COD-OPS", "Respaldo Atómico (15ms) y Restore (18ms)", "Dev 2", "DONE (DoD)", "datos/backup.py | restore.py"),
        ("COD-U01", "Frontend SPA Operador & Admin (React 19)", "Dev 3", "DONE (DoD)", "src/frontend/ (Build en 2.0s)"),
        ("COD-U02", "Ficha QR SVG + Simulador Móvil 375px", "Dev 4", "DONE (DoD)", "src/frontend/PasaportePublico.jsx"),
        ("DOC-E04", "Manual de Usuario y Demo < 120s", "Dev 1 / Dev 3", "DONE (DoD)", "documentos/E04_manual.pdf"),
        ("DOC-E05", "Informe y Archivos de Pruebas (38 Tests)", "Equipo", "DONE (DoD)", "documentos/E05_pruebas.pdf"),
        ("DOC-E06", "Informe de Usabilidad Externa en Stand", "Dev 4", "DONE (DoD)", "documentos/E06_usabilidad.pdf"),
        ("DOC-E07", "Operación, Respaldo y Mantenimiento", "Dev 2", "DONE (DoD)", "documentos/E07_operacion.pdf"),
        ("DOC-E08", "Bitácora IA, Skills y Prompts Literales", "Dev 1", "DONE (DoD)", "documentos/E08_IA_y_fuentes.pdf"),
        ("DOC-E09", "Propuesta Comercial y Pitch Oficial", "Dev 4", "DONE (DoD)", "documentos/E09_presentacion.pdf"),
        ("DOC-E10", "Índice de Entrega y Matriz Trazabilidad", "Equipo", "DONE (DoD)", "ENTREGA.md / E10_entrega.md"),
        ("COD-AUTH", "Login Criptográfico PBKDF2 y Roles RBAC", "Dev 1 & 2", "DONE (DoD)", "LoginView.jsx | rbac.py"),
        ("FEAT-CAT-B2B", "Catálogo Industrial y Botánico B2B", "Dev 1 & 4", "DONE (DoD)", "subproductos.py | Catalogo.jsx"),
        ("FEAT-MERMA-KG", "Venta Cascarilla por Kilo ($14.500-$16.500)", "Dev 1 & 4", "DONE (DoD)", "calculos.py | seed.py"),
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
        st_par = Paragraph(est, status_done)
        table_rows.append(
            [
                Paragraph(f"<b>{tid}</b>", td_bold),
                Paragraph(desc, td_style),
                Paragraph(resp, td_style),
                st_par,
                Paragraph(f"<code>{evid}</code>", td_style),
            ]
        )

    col_widths = [1.0 * inch, 3.2 * inch, 1.2 * inch, 1.3 * inch, 3.3 * inch]
    kanban_table = Table(table_rows, colWidths=col_widths, repeatRows=1)

    t_style = [
        ("BACKGROUND", (0, 0), (-1, 0), CACAO_BROWN),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("GRID", (0, 0), (-1, -1), 0.5, SLATE_BORDER),
    ]

    for idx in range(1, len(table_rows)):
        if idx % 2 == 0:
            t_style.append(("BACKGROUND", (0, idx), (-1, idx), SLATE_BG))

    kanban_table.setStyle(TableStyle(t_style))
    story.append(kanban_table)

    doc.build(story)

    # Copiar también a la raíz para fácil acceso
    if OUTPUT_PDF.exists():
        import shutil
        shutil.copyfile(str(OUTPUT_PDF), str(ROOT_PDF))
        print(f"[OK] Tablero Kanban generado exitosamente en:")
        print(f"     -> {OUTPUT_PDF}")
        print(f"     -> {ROOT_PDF}")


if __name__ == "__main__":
    generar_pdf_e04 = generar_pdf
    generar_pdf_e04()
