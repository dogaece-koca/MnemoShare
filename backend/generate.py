from mnemonic import Mnemonic

mnemo = Mnemonic("english")

def generate_mnemonic(strength: int = 128) -> str:
    return mnemo.generate(strength=strength)

def mnemonic_to_entropy(phrase: str) -> str:
    return mnemo.to_entropy(phrase).hex()

def entropy_to_mnemonic(hex_entropy: str) -> str:
    entropy_bytes = bytes.fromhex(hex_entropy)
    return mnemo.to_mnemonic(entropy_bytes)