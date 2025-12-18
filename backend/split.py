from generate import mnemonic_to_entropy
# Import corrected math library
from sss_core import PRIME, to_num, num_to_hex, split_core

def split_secret(secret: str, threshold: int, shares: int) -> list:
    """
    Secret (Mnemonic) -> Entropy (Hex) -> Number -> Shamir Shares
    """
    if threshold < 2:
        raise ValueError("Threshold must be at least 2.")
    if threshold > shares:
        raise ValueError("Threshold cannot be greater than the total number of shares (n).")

    # 1. Convert Mnemonic to Entropy (HEX String)
    # Example: "cat dog ..." -> "a1b2..."
    hex_secret = mnemonic_to_entropy(secret)

    # 2. Convert Hex to number
    secret_num = to_num(hex_secret)

    # 3. Run the math and generate shares
    raw_shares = split_core(secret_num, threshold, shares, PRIME)

    # 4. Convert shares to user-friendly string format (x-y)
    # Example: "1-fa43..."
    return [f"{x}-{num_to_hex(y)}" for x, y in raw_shares]