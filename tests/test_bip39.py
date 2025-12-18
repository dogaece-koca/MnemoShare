import unittest
from bip39_validator import is_valid_mnemonic

# BIP-39 standartlarında geçerli ve geçersiz örnekler
VALID_MNEMONIC = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
INVALID_MNEMONIC_CHECKSUM = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon"

class TestBip39Validator(unittest.TestCase):

    def test_valid_mnemonic(self):
        """Geçerli bir BIP-39 mnemonic'i test eder."""
        self.assertTrue(is_valid_mnemonic(VALID_MNEMONIC), "Bu mnemonic geçerli olmalıdır (doğru checksum).")

    def test_invalid_mnemonic(self):
        """Geçersiz bir BIP-39 mnemonic'i (yanlış checksum) test eder."""
        self.assertFalse(is_valid_mnemonic(INVALID_MNEMONIC_CHECKSUM), "Bu mnemonic geçersiz olmalıdır (yanlış checksum).")
        
    def test_non_mnemonic_string(self):
        """BIP-39 olmayan kısa bir metni test eder."""
        self.assertFalse(is_valid_mnemonic("hello world"), "Kısa metinler geçersiz olmalıdır.")

if __name__ == '__main__':
    unittest.main()