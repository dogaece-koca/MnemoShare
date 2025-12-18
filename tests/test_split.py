import unittest
from split import split_secret

# Test için sabit bir sır tanımlayalım
TEST_SECRET = "test secret for shamir sharing"

class TestSplit(unittest.TestCase):

    def test_basic_split(self):
        """Basit (3, 5) bölme işlemini test eder."""
        threshold = 3
        shares = 5
        result_shares = split_secret(TEST_SECRET, threshold, shares)
        self.assertEqual(len(result_shares), shares, "Toplam pay sayısı n'ye eşit olmalıdır.")
        # Payların Shamir's Scheme formatında olduğunu kontrol edin (örneğin '2-...' ile başlar)
        for share in result_shares:
            self.assertTrue(isinstance(share, str) and '-' in share, "Paylar string ve Shamir formatında olmalıdır.")

    def test_threshold_too_low(self):
        """Eşik değerinin (t) çok düşük olmasını test eder (t < 2)."""
        with self.assertRaises(ValueError) as cm:
            split_secret(TEST_SECRET, 1, 3)
        self.assertIn("Threshold must be >=2", str(cm.exception), "Eşik < 2 olduğunda hata fırlatılmalıdır.")

    def test_threshold_too_high(self):
        """Eşik değerinin (t) toplam pay sayısından (n) büyük olmasını test eder (t > n)."""
        with self.assertRaises(ValueError) as cm:
            split_secret(TEST_SECRET, 5, 4)
        self.assertIn("Threshold must be >=2 and <= total shares", str(cm.exception), "Eşik > n olduğunda hata fırlatılmalıdır.")

if __name__ == '__main__':
    unittest.main()