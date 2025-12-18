from generate import mnemonic_to_entropy
# Düzeltilmiş matematik kütüphanesini import ediyoruz
from sss_core import PRIME, to_num, num_to_hex, split_core

def split_secret(secret: str, threshold: int, shares: int) -> list:
    """
    Secret (Mnemonic) -> Entropy (Hex) -> Number -> Shamir Shares
    """
    if threshold < 2:
        raise ValueError("Eşik değeri (threshold) en az 2 olmalıdır.")
    if threshold > shares:
        raise ValueError("Eşik değeri toplam pay sayısından (n) büyük olamaz.")

    # 1. Mnemonic'i Entropi (HEX String) haline getir
    # Örnek: "cat dog ..." -> "a1b2..."
    hex_secret = mnemonic_to_entropy(secret)

    # 2. Hex'i sayıya çevir
    secret_num = to_num(hex_secret)

    # 3. Matematiği çalıştır ve payları üret
    raw_shares = split_core(secret_num, threshold, shares, PRIME)

    # 4. Payları kullanıcı dostu string formatına (x-y) çevir
    # Örnek: "1-fa43..."
    return [f"{x}-{num_to_hex(y)}" for x, y in raw_shares]