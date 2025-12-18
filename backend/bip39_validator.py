from mnemonic import Mnemonic

mnemo = Mnemonic("english")

def is_valid_mnemonic(phrase: str) -> bool:
    try:
        return mnemo.check(phrase)
    except Exception:
        return False
