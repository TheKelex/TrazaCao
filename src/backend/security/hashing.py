"""
Utilidades de Encriptación y Hashing de Contraseñas - TrazaCao Huila
Implementa hashing seguro con PBKDF2-HMAC-SHA256 y salt criptográfico de 16 bytes.
Cumple con recomendaciones OWASP y garantiza compatibilidad nativa en Python 3.13+.
"""

import os
import hashlib
import hmac


def hash_password(plain_password: str) -> str:
    """
    Genera un hash seguro con salt aleatorio de 16 bytes y 100,000 iteraciones PBKDF2-SHA256.
    Retorna el string con formato: pbkdf2_sha256$100000$<salt_hex>$<hash_hex>
    """
    salt = os.urandom(16)
    iterations = 100000
    hash_bytes = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        iterations,
    )
    return f"pbkdf2_sha256${iterations}${salt.hex()}${hash_bytes.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con el hash almacenado.
    Utiliza hmac.compare_digest para prevenir ataques de temporización (timing attacks).
    """
    if not hashed_password or "$" not in hashed_password:
        return False
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4:
            return False
        algorithm, iterations_str, salt_hex, hash_hex = parts
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_str)
        salt = bytes.fromhex(salt_hex)
        expected_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            iterations,
        )
        return hmac.compare_digest(expected_hash.hex(), hash_hex)
    except Exception:
        return False
