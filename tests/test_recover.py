import unittest
from split import split_secret
from recover import recover_secret

# Test için sabit bir sır ve pay parametreleri
TEST_SECRET = "test secret for recovery"
THRESHOLD = 3
TOTAL_SHARES = 5

class TestRecover(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Tüm testler için bir kez payları oluştur."""
        cls.shares = split_secret(TEST_SECRET, THRESHOLD, TOTAL_SHARES)
        # Sadece 3 pay alalım (başarılı kurtarma için t=3)
        cls.required_shares = cls.shares[:THRESHOLD]
        # Yetersiz pay alalım (başarısız kurtarma için t-1=2)
        cls.insufficient_shares = cls.shares[:THRESHOLD-1]

    def test_successful_recovery(self):
        """Başarılı bir (3, 5) kurtarma işlemini test eder (Senaryo 1)[cite: 133, 137, 139]."""
        recovered = recover_secret(self.required_shares)
        self.assertEqual(recovered, TEST_SECRET, "Kurtarılan sır orijinal sır ile aynı olmalıdır.")

    def test_insufficient_shares_failure(self):
        """Yetersiz pay ile kurtarma girişimini test eder (Senaryo 2 - Güvenlik İhlali)[cite: 133, 140]."""
        # Shamir's Scheme'de yetersiz paylar rastgele bir değer üretir.
        # secretsharing kütüphanesi bu rastgele değeri döndürür, ancak bu değerin 
        # orijinal sır olmaması gerektiğini kontrol ederiz.
        recovered = recover_secret(self.insufficient_shares)
        self.assertNotEqual(recovered, TEST_SECRET, "Yetersiz pay, sırrı ortaya çıkarmamalıdır.")
        
    def test_recovery_with_extra_shares(self):
        """Gerekenden fazla pay ile kurtarmayı test eder (örneğin 4 pay ile)."""
        extra_shares = self.shares[:4] # t=3 olduğu için 4 pay yeterli
        recovered = recover_secret(extra_shares)
        self.assertEqual(recovered, TEST_SECRET, "Gerekenden fazla pay ile de kurtarma başarılı olmalıdır.")

    def test_recovery_with_wrong_share_format(self):
        """Yanlış formatta pay girildiğinde kütüphane hatasını test eder."""
        with self.assertRaises(Exception) as cm:
            recover_secret(["not a valid share", "another invalid share"])
        # Kütüphane hatası (Lagrange Interpolation hatası) beklenir
        self.assertIn("Failed to recover secret", str(cm.exception) or "An error occurred", "Geçersiz pay formatı hata fırlatmalıdır.")

if __name__ == '__main__':
    unittest.main()