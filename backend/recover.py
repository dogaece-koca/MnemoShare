from generate import entropy_to_mnemonic
from sss_core import PRIME, to_num, num_to_hex, combine_core

def recover_secret(shares: list) -> str:
    shares_tuple = []
    for share_str in shares:
        try:
            x_str, y_hex = share_str.strip().split('-')
            x = int(x_str)
            y = to_num(y_hex)
            shares_tuple.append((x, y))
        except ValueError:
            raise ValueError(f"Invalid share format: {share_str}. Must be in 'Index-HexData' format.")

    try:
        recovered_num = combine_core(shares_tuple, PRIME)
    except Exception as e:
        raise ValueError(f"Mathematical recovery error: {str(e)}")

    recovered_hex = num_to_hex(recovered_num)

    try:
        mnemonic = entropy_to_mnemonic(recovered_hex)
        return mnemonic
    except Exception:
        raise ValueError("Failed to recover secret or invalid mnemonic generated. Ensure you have provided enough valid shares.")