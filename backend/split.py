from generate import mnemonic_to_entropy
from sss_core import PRIME, to_num, num_to_hex, split_core

def split_secret(secret: str, threshold: int, shares: int) -> list:
    if threshold < 2:
        raise ValueError("Threshold must be at least 2.")
    if threshold > shares:
        raise ValueError("Threshold cannot be greater than the total number of shares (n).")

    hex_secret = mnemonic_to_entropy(secret)

    secret_num = to_num(hex_secret)

    raw_shares = split_core(secret_num, threshold, shares, PRIME)

    return [f"{x}-{num_to_hex(y)}" for x, y in raw_shares]