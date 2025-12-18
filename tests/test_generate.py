import unittest
from generate import generate_mnemonic

class TestGenerate(unittest.TestCase):
    
    def test_generate_12_words(self):
        """128 bit (12 kelime) gücünde mnemonic oluşturmayı test eder."""
        mnemonic = generate_mnemonic(strength=128)
        self.assertEqual(len(mnemonic.split()), 12, "128 bit 12 kelime üretmeli.")

    def test_generate_24_words(self):
        """256 bit (24 kelime) gücünde mnemonic oluşturmayı test eder."""
        mnemonic = generate_mnemonic(strength=256)
        self.assertEqual(len(mnemonic.split()), 24, "256 bit 24 kelime üretmeli.")

if __name__ == '__main__':
    unittest.main()