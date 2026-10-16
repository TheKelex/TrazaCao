"""
Script de Inicialización y Semilla de Datos - CacaoTrace Huila
Carga los datos base sintéticos oficiales del reto (CAC001, CAC002, CAC003)
y amplía el catálogo con lotes de especialidad (CAC004, CAC005, CAC006) y múltiples
transformaciones agroindustriales con mermas valorizadas para el Catálogo Botánico & Industrial B2B.
"""

import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Asegurar path correcto
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from infra.database import init_db, SessionLocal
from models import Lote, Transformacion, AuditoriaLog, Usuario, Comprador, OrdenVenta
from security.hashing import hash_password
from domain.calculos import balance_agroindustrial_completo


def seed():
    print("Iniciando carga de datos sintéticos oficiales y catálogo B2B ampliado...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Recrear tablas limpiamente para reset total (evita violar el trigger de inmutabilidad)
        from models import Base
        from infra.database import engine
        Base.metadata.drop_all(bind=engine)
        init_db()
        db = SessionLocal()

        # 1.1 Carga de Usuarios Oficiales con Contraseñas Encriptadas PBKDF2
        usuarios_base = [
            Usuario(
                id="usr-admin-01",
                username="admin",
                password_hash=hash_password("AdminTrazaCao2026!"),
                nombre_completo="Dirección Técnica y Calidad",
                rol="ADMINISTRADOR",
                email="admin@trazacao.com",
                telefono="+57 310 456 7890",
                cedula="12345678",
                activo=True,
            ),
            Usuario(
                id="usr-operador-01",
                username="operador",
                password_hash=hash_password("OperadorCacao2026!"),
                nombre_completo="Operador de Acopio y Planta (Rivera)",
                rol="OPERADOR",
                email="operador.rivera@trazacao.com",
                telefono="+57 315 123 4567",
                cedula="87654321",
                activo=True,
            ),
            Usuario(
                id="usr-operador-02",
                username="operador_campoalegre",
                password_hash=hash_password("OperadorCacao2026!"),
                nombre_completo="Javier Cuéllar (Campoalegre)",
                rol="OPERADOR",
                email="j.cuellar@trazacao.com",
                telefono="+57 312 987 6543",
                cedula="1075234567",
                activo=True,
            ),
            Usuario(
                id="usr-operador-03",
                username="operador_suspendido",
                password_hash=hash_password("OperadorCacao2026!"),
                nombre_completo="Marlon Perdomo (Algeciras)",
                rol="OPERADOR",
                email="m.perdomo@trazacao.com",
                telefono="+57 320 555 4321",
                cedula="1075998877",
                activo=False,
                motivo_inactivacion="Vetado temporalmente por investigación de no conformidad en secado",
            ),
        ]
        for u in usuarios_base:
            db.add(u)
            db.add(
                AuditoriaLog(
                    usuario="sistema_seed",
                    accion="CREACION",
                    lote_id="SISTEMA",
                    valor_anterior=None,
                    valor_nuevo=f"Usuario: {u.username}, Rol: {u.rol}, Nombre: {u.nombre_completo}, Activo: {u.activo}",
                    motivo="Carga inicial de personal con contraseña encriptada (PBKDF2-SHA256)",
                )
            )

        # 1.2 Carga de Compradores B2B Iniciales
        compradores_base = [
            Comprador(
                id="cmp-huila-chocolates-01",
                email="comprador@chocolateshuila.com",
                password_hash=hash_password("Comprador2026!"),
                nombre_contacto="Valentina Morales",
                empresa_o_razon_social="Chocolatería Artesanal del Huila SAS",
                telefono="+57 318 654 3210",
                pais_ciudad="Colombia, Neiva",
                activo=True,
                fecha_registro=datetime.utcnow(),
            ),
            Comprador(
                id="cmp-swiss-cacao-02",
                email="contact@swisscocoa.ch",
                password_hash=hash_password("SwissCocoa2026!"),
                nombre_contacto="Hans Peter Meier",
                empresa_o_razon_social="Alpine Premium Chocolate AG",
                telefono="+41 22 555 1234",
                pais_ciudad="Suiza, Zúrich",
                activo=True,
                fecha_registro=datetime.utcnow(),
            ),
        ]
        for c in compradores_base:
            db.add(c)
            db.add(
                AuditoriaLog(
                    usuario="sistema_seed",
                    accion="REGISTRO_COMPRADOR",
                    lote_id="CLIENTES",
                    valor_anterior=None,
                    valor_nuevo=f"Cliente: {c.empresa_o_razon_social}, Contacto: {c.nombre_contacto}",
                    motivo="Carga inicial de clientes compradores B2B en semilla",
                )
            )

        db.commit()
        print("[OK] Usuarios administradores, operarios (activos y vetados) y compradores B2B creados.")

        # 2. Lotes Base y Ampliados del Huila (Rivera, Campoalegre y Algeciras)
        ahora = datetime.utcnow()
        lotes_base = [
            Lote(
                id="CAC001",
                productor="Carlos Alberto Gómez (Finca Villa Esperanza)",
                origen="Rivera",
                humedad_porcentaje=Decimal("7.50"),
                fermentacion_porcentaje=Decimal("78.00"),
                kg_recibidos=Decimal("200.00"),
                kg_disponibles=Decimal("200.00"),
                estado="LIBERADO",
                fecha_recepcion=ahora - timedelta(days=6),
            ),
            Lote(
                id="CAC002",
                productor="María Algeciras (Finca El Paraíso)",
                origen="Campoalegre",
                humedad_porcentaje=Decimal("7.20"),
                fermentacion_porcentaje=Decimal("80.00"),
                kg_recibidos=Decimal("150.00"),
                kg_disponibles=Decimal("150.00"),
                estado="LIBERADO",
                fecha_recepcion=ahora - timedelta(days=5),
            ),
            Lote(
                id="CAC003",
                productor="Hernando Trujillo (Finca La Esperanza)",
                origen="Algeciras",
                humedad_porcentaje=Decimal("7.40"),
                fermentacion_porcentaje=Decimal("76.00"),
                kg_recibidos=Decimal("90.00"),
                kg_disponibles=Decimal("90.00"),
                estado="PENDIENTE",
                fecha_recepcion=ahora - timedelta(days=2),
            ),
            Lote(
                id="CAC004",
                productor="Gonzalo Perdomo (Finca La Cabaña)",
                origen="Rivera",
                humedad_porcentaje=Decimal("7.10"),
                fermentacion_porcentaje=Decimal("81.00"),
                kg_recibidos=Decimal("180.00"),
                kg_disponibles=Decimal("180.00"),
                estado="LIBERADO",
                fecha_recepcion=ahora - timedelta(days=4),
            ),
            Lote(
                id="CAC005",
                productor="Esperanza Losada (Finca El Mirador)",
                origen="Campoalegre",
                humedad_porcentaje=Decimal("6.90"),
                fermentacion_porcentaje=Decimal("84.00"),
                kg_recibidos=Decimal("220.00"),
                kg_disponibles=Decimal("220.00"),
                estado="LIBERADO",
                fecha_recepcion=ahora - timedelta(days=3),
            ),
            Lote(
                id="CAC006",
                productor="Fabio Dussán (Finca San Isidro)",
                origen="Algeciras",
                humedad_porcentaje=Decimal("7.30"),
                fermentacion_porcentaje=Decimal("79.00"),
                kg_recibidos=Decimal("160.00"),
                kg_disponibles=Decimal("160.00"),
                estado="LIBERADO",
                fecha_recepcion=ahora - timedelta(days=1),
            ),
        ]

        for l in lotes_base:
            db.add(l)
            db.add(
                AuditoriaLog(
                    usuario="sistema_seed",
                    accion="CREACION",
                    lote_id=l.id,
                    valor_anterior=None,
                    valor_nuevo=f"Recibidos: {l.kg_recibidos} kg, Productor: {l.productor}, Origen: {l.origen}",
                    motivo="Carga inicial de datos sintéticos del caso de estudio",
                )
            )
        db.commit()
        print("[OK] 6 Lotes creados exitosamente en Rivera, Campoalegre y Algeciras.")

        # 3. Registrar Transformaciones Agroindustriales con Mermas Valorizadas B2B
        transformaciones_datos = [
            {
                "id": "trans-cac001-oficial",
                "lote_id": "CAC001",
                "etapa": "Tostión y Molienda",
                "responsable": "Operador Planta Rivera",
                "kg_entrada": Decimal("100.00"),
                "kg_salida": Decimal("80.00"),
                "costo_etapa": Decimal("1600000.00"),
                "precio_venta": Decimal("25000.00"),
                "justificacion": "Tostión canónica oficial del reto con merma del 20.00%.",
                "fecha": ahora - timedelta(days=4),
            },
            {
                "id": "trans-cac002-beneficio",
                "lote_id": "CAC002",
                "etapa": "Descascarillado y Selección",
                "responsable": "Operador Campoalegre",
                "kg_entrada": Decimal("60.00"),
                "kg_salida": Decimal("51.00"),
                "costo_etapa": Decimal("1020000.00"),
                "precio_venta": Decimal("24500.00"),
                "justificacion": "Descascarillado óptimo dentro de tolerancia (15.00%).",
                "fecha": ahora - timedelta(days=3),
            },
            {
                "id": "trans-cac004-tostion",
                "lote_id": "CAC004",
                "etapa": "Tostión Controlada de Especialidad",
                "responsable": "Operador Planta Rivera",
                "kg_entrada": Decimal("80.00"),
                "kg_salida": Decimal("64.00"),
                "costo_etapa": Decimal("1360000.00"),
                "precio_venta": Decimal("26000.00"),
                "justificacion": "Tostión media para resaltar perfil frutal y separación de cascarilla.",
                "fecha": ahora - timedelta(days=2),
            },
            {
                "id": "trans-cac005-descascarillado",
                "lote_id": "CAC005",
                "etapa": "Descascarillado Mecánico de Precisión",
                "responsable": "Operador Campoalegre",
                "kg_entrada": Decimal("100.00"),
                "kg_salida": Decimal("82.00"),
                "costo_etapa": Decimal("1640000.00"),
                "precio_venta": Decimal("25500.00"),
                "justificacion": "Separación de finos para cosmética botánica y cascarilla limpia.",
                "fecha": ahora - timedelta(days=1),
            },
            {
                "id": "trans-cac006-tostion",
                "lote_id": "CAC006",
                "etapa": "Tostión Tradicional Andina",
                "responsable": "Operador Algeciras",
                "kg_entrada": Decimal("70.00"),
                "kg_salida": Decimal("58.00"),
                "costo_etapa": Decimal("1160000.00"),
                "precio_venta": Decimal("24000.00"),
                "justificacion": "Pérdida por humedad residual en secado solar y separación de merma.",
                "fecha": ahora - timedelta(hours=18),
            },
        ]

        total_merma_recuperada = Decimal("0.00")

        for td in transformaciones_datos:
            # Descontar del saldo disponible del lote
            lote_obj = db.query(Lote).filter(Lote.id == td["lote_id"]).first()
            lote_obj.kg_disponibles = lote_obj.kg_disponibles - td["kg_entrada"]

            # Balance agroindustrial matemático con Domain Onion
            balance = balance_agroindustrial_completo(
                kg_entrada=td["kg_entrada"],
                kg_salida_vendible=td["kg_salida"],
                costo_total_etapa_cop=td["costo_etapa"],
                precio_venta_cop=td["precio_venta"],
            )
            circular = balance["economia_circular"]
            total_merma_recuperada += circular["kg_cascarilla_recuperada"]

            trans_obj = Transformacion(
                id=td["id"],
                lote_id=td["lote_id"],
                etapa=td["etapa"],
                responsable=td["responsable"],
                kg_entrada=td["kg_entrada"],
                kg_salida_vendible=td["kg_salida"],
                kg_cascarilla=circular["kg_cascarilla_recuperada"],
                merma_porcentaje=balance["merma_porcentaje"],
                alerta_merma=balance["alerta_merma"],
                alerta_explicacion=balance["alerta_explicacion"],
                costo_etapa_cop=td["costo_etapa"],
                costo_unitario_cop=balance["costo_unitario_cop"],
                precio_venta_estimado=td["precio_venta"],
                margen_venta_porcentaje=balance["margen_venta_porcentaje"],
                ingreso_cascarilla_cop=circular["ingreso_adicional_cop"],
                costo_neto_circular_cop=circular["costo_neto_circular_cop"],
                incidencia_justificacion=td["justificacion"],
                fecha_transformacion=td["fecha"],
            )
            db.add(trans_obj)

            db.add(
                AuditoriaLog(
                    usuario="sistema_seed",
                    accion="TRANSFORMACION",
                    lote_id=td["lote_id"],
                    valor_anterior=f"Consumo: {td['kg_entrada']} kg",
                    valor_nuevo=f"Salida: {td['kg_salida']} kg, Merma: {balance['merma_porcentaje']}%, Cascarilla: {circular['kg_cascarilla_recuperada']} kg",
                    motivo=td["justificacion"],
                )
            )

        db.commit()
        print(f"[OK] 5 Transformaciones registradas. Merma total recuperada: {total_merma_recuperada} kg.")

        # 4. Registrar Solicitudes de Cotización B2B Canónicas de Prueba en Auditoría
        solicitudes_iniciales = [
            {
                "empresa": "BioCosmética Andina S.A.S.",
                "sector": "Industria Cosmética y Dermocosmética",
                "subproducto": "SUB-COSM-01 (Residuo de Cacao en Bruto / Cascarilla Pura de Tostión)",
                "lote_id": "CAC001",
                "cantidad": Decimal("500.00"),
                "contacto": "compras@biocosmetica.com",
                "aplicacion": "Adquisición de residuo en bruto para que la empresa formule en su planta mascarillas faciales y exfoliantes corporales",
            },
            {
                "empresa": "FertiOrgánicos del Huila Ltda.",
                "sector": "Agroquímica Orgánica y Biofertilizantes",
                "subproducto": "SUB-AGRO-02 (Biomasa Residual en Bruto Alta en Potasio)",
                "lote_id": "CAC004",
                "cantidad": Decimal("1200.00"),
                "contacto": "insumos@fertiorganicos.co",
                "aplicacion": "Compra de biomasa residual en bruto para fermentación industrial de biol foliar y enmiendas de suelo",
            },
            {
                "empresa": "Laboratorios Fitoterapéuticos del Sur",
                "sector": "Extractos Botánicos, Fitofármacos y Nutracéutica",
                "subproducto": "SUB-BOTA-02 (Residuo de Cascarilla Tostada en Bruto)",
                "lote_id": "CAC005",
                "cantidad": Decimal("350.00"),
                "contacto": "desarrollo@fitosur.org",
                "aplicacion": "Compra de cascarilla en bruto para extracción de polifenoles y teobromina bioactiva en su laboratorio",
            },
        ]

        for s in solicitudes_iniciales:
            folio = f"COT-B2B-{os.urandom(4).hex().upper()}"
            db.add(
                AuditoriaLog(
                    usuario="portal_b2b_comprador",
                    accion="SOLICITUD_COTIZACION_MERMA",
                    lote_id=s["lote_id"],
                    valor_anterior=None,
                    valor_nuevo=f"Folio: {folio}, Empresa: {s['empresa']}, Subproducto: {s['subproducto']}, Cantidad: {s['cantidad']} kg",
                    motivo=f"Sector: {s['sector']}. Aplicación: {s['aplicacion']}. Contacto: {s['contacto']}",
                )
            )

        db.commit()
        print("[OK] Solicitudes B2B de prueba registradas en bitácora inmutable.")

        print("\n=======================================================")
        print("          RESUMEN DE INICIALIZACIÓN TRAZACAO B2B       ")
        print("=======================================================")
        print(" • Usuarios: 'admin' (Dirección) / 'operador' (Planta)")
        print(" • Lotes Activos: CAC001, CAC002, CAC003, CAC004, CAC005, CAC006")
        print(" • Municipios: Rivera, Campoalegre y Algeciras")
        print(f" • Merma Total Recuperada para B2B: {total_merma_recuperada} kg")
        print(" • Catálogo de Residuos B2B: 9 referencias de merma pura en bruto")
        print(" • Principio de Negocio: TrazaCao vende solo la merma/residuo en bruto; no compite fabricando productos terminados.")
        print("=======================================================\n")
        print("[EXITO] Base de datos inicializada y poblada con éxito.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Falló la inicialización: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
