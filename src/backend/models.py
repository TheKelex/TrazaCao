"""
Modelos ORM - CacaoTrace Huila (SQLAlchemy 2.0)
Define las tablas de base de datos para lotes, transformaciones y auditoría.
Cumple con las restricciones SQL atómicas para evitar saldos negativos.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Integer,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Lote(Base):
    """
    Tabla de lotes recibidos en centro de acopio (RF01, RF08, RF09).
    Restricción SQL: kg_disponibles nunca puede ser negativo.
    """
    __tablename__ = "lotes"

    id = Column(String(50), primary_key=True)  # ej. CAC001, CAC002, CAC003
    productor = Column(String(150), nullable=False)
    origen = Column(String(100), nullable=False)  # Rivera, Campoalegre, Algeciras
    humedad_porcentaje = Column(Numeric(5, 2), default=7.50, nullable=False)
    fermentacion_porcentaje = Column(Numeric(5, 2), default=75.00, nullable=False)
    kg_recibidos = Column(Numeric(10, 2), nullable=False)
    kg_disponibles = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(20), default="PENDIENTE", nullable=False)  # PENDIENTE, LIBERADO, BLOQUEADO
    motivo_bloqueo = Column(Text, nullable=True)
    fecha_recepcion = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relación con transformaciones
    transformaciones = relationship("Transformacion", back_populates="lote", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("kg_recibidos > 0", name="chk_lote_recibidos_positivo"),
        CheckConstraint("kg_disponibles >= 0", name="chk_lote_disponibles_no_negativo"),
    )


class Transformacion(Base):
    """
    Tabla de transformaciones agroindustriales (RF02, RF04, RF05, RF12).
    Registra entradas, salidas vendibles, subproducto (cascarilla) y métricas de costo/margen.
    """
    __tablename__ = "transformaciones"

    id = Column(String(36), primary_key=True)  # UUID4
    lote_id = Column(String(50), ForeignKey("lotes.id"), nullable=False)
    etapa = Column(String(100), nullable=False)  # ej. Tostión y Molienda
    responsable = Column(String(150), nullable=False)
    kg_entrada = Column(Numeric(10, 2), nullable=False)
    kg_salida_vendible = Column(Numeric(10, 2), nullable=False)
    kg_cascarilla = Column(Numeric(10, 2), nullable=False)
    merma_porcentaje = Column(Numeric(5, 2), nullable=False)
    alerta_merma = Column(Boolean, default=False, nullable=False)
    alerta_explicacion = Column(Text, nullable=True)
    costo_etapa_cop = Column(Numeric(12, 2), default=1600000.00, nullable=False)
    costo_unitario_cop = Column(Numeric(12, 2), nullable=True)
    precio_venta_estimado = Column(Numeric(12, 2), default=25000.00, nullable=False)
    margen_venta_porcentaje = Column(Numeric(5, 2), nullable=True)
    ingreso_cascarilla_cop = Column(Numeric(12, 2), default=0.00, nullable=False)
    costo_neto_circular_cop = Column(Numeric(12, 2), default=1600000.00, nullable=False)
    incidencia_justificacion = Column(Text, nullable=True)
    fecha_transformacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relación inversa
    lote = relationship("Lote", back_populates="transformaciones")


class AuditoriaLog(Base):
    """
    Tabla de bitácora de auditoría inmutable (RF10).
    Protegida por triggers nativos de SQLite para impedir UPDATE y DELETE.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    usuario = Column(String(100), nullable=False)
    accion = Column(String(50), nullable=False)  # CREACION, TRANSFORMACION, BLOQUEO, LIBERACION, INTENTO_NO_AUTORIZADO
    lote_id = Column(String(50), nullable=False)
    valor_anterior = Column(Text, nullable=True)
    valor_nuevo = Column(Text, nullable=True)
    motivo = Column(Text, nullable=True)


class Usuario(Base):
    """
    Tabla de usuarios autenticados del sistema TrazaCao Huila.
    Almacena credenciales con contraseñas encriptadas mediante PBKDF2-HMAC-SHA256.
    """
    __tablename__ = "usuarios"

    id = Column(String(36), primary_key=True)  # UUID4
    username = Column(String(50), unique=True, index=True, nullable=False)  # ej. 'operador', 'admin'
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(150), nullable=False)
    rol = Column(String(30), nullable=False)  # 'OPERADOR' | 'ADMINISTRADOR'
    email = Column(String(120), nullable=True)
    telefono = Column(String(50), nullable=True)
    cedula = Column(String(50), nullable=True)
    motivo_inactivacion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)


class Comprador(Base):
    """
    Tabla de clientes compradores registrados del sistema TrazaCao Huila.
    Permite autenticación propia de compradores, registro comercial y trazabilidad de pedidos.
    """
    __tablename__ = "compradores"

    id = Column(String(36), primary_key=True)  # UUID4
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nombre_contacto = Column(String(150), nullable=False)
    empresa_o_razon_social = Column(String(150), nullable=False)
    telefono = Column(String(50), nullable=True)
    pais_ciudad = Column(String(100), default="Colombia", nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relación con sus órdenes de compra directa
    ventas = relationship("OrdenVenta", back_populates="comprador", cascade="all, delete-orphan")


class OrdenVenta(Base):
    """
    Tabla de ventas directas efectivas con descuento atómico de inventario (Cacao y Cascarilla).
    """
    __tablename__ = "ordenes_venta"

    id = Column(String(50), primary_key=True)  # ej. VTA-CAC001-20261016-001
    comprador_id = Column(String(36), ForeignKey("compradores.id"), nullable=False)
    tipo_producto = Column(String(50), nullable=False)  # "LOTE_CACAO" | "MERMA_CASCARILLA"
    item_id = Column(String(50), nullable=False)  # CAC001, SUB-COSM-01, etc.
    item_nombre = Column(String(150), nullable=False)
    kg_comprados = Column(Numeric(10, 2), nullable=False)
    precio_kg_cop = Column(Numeric(12, 2), nullable=False)
    total_cop = Column(Numeric(12, 2), nullable=False)
    estado = Column(String(30), default="PAGADA_Y_DESPACHADA", nullable=False)
    direccion_entrega = Column(String(250), nullable=True)
    fecha_orden = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relación inversa con el comprador
    comprador = relationship("Comprador", back_populates="ventas")

    __table_args__ = (
        CheckConstraint("kg_comprados > 0", name="chk_venta_kg_positivo"),
        CheckConstraint("total_cop >= 0", name="chk_venta_total_no_negativo"),
    )


