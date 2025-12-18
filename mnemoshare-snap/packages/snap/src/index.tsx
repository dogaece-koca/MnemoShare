import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Divider, Copyable, Bold } from '@metamask/snaps-sdk/jsx';

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  switch (request.method) {
    case 'split_secret':
      // 1. Şifreyi İste
      const secret = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'prompt',
          content: (
            <Box>
              <Heading>MnemoShare 🔐</Heading>
              <Text>
                Gizli anahtarınızı aşağıya yapıştırın.
                <Bold> Veri parçalanıp sunucudan silinecektir.</Bold>
              </Text>
            </Box>
          ),
          placeholder: 'Gizli Anahtar...',
        },
      });

      if (!secret || typeof secret !== 'string') return null;

      try {
        // 2. Python'a Gönder
        const response = await fetch('http://127.0.0.1:5000/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: secret, t: 3, n: 5 }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // 3. Kullanıcıya Bilgi Ver (Sadece Metin)
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <Box>
                <Heading>Başarılı! 🎉</Heading>
                <Text>Parçalar oluşturuldu. QR Kodlarını görmek için web sitesine dönün.</Text>
              </Box>
            ),
          },
        });

        // 4. KRİTİK NOKTA: Veriyi Web Sitesine Geri Döndür
        return { shares: data.shares };

      } catch (error) {
        throw new Error(String(error));
      }

    default:
      throw new Error('Method not found.');
  }
};
