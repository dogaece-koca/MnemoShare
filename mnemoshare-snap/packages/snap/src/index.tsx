import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Divider, Copyable, Bold } from '@metamask/snaps-sdk/jsx';

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  switch (request.method) {
    case 'split_secret':
      // 1. ADIM: Kullanıcıdan Şifreyi İste (Web sitesi görmeden)
      const secret = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'prompt',
          content: (
            <Box>
              <Heading>MnemoShare</Heading>
              <Text>
                Please paste your Master Secret below.
                <Bold> It will be processed securely and never shared with the website.</Bold>
              </Text>
            </Box>
          ),
          placeholder: 'Enter your mnemonic or private key...',
        },
      });

      if (!secret || typeof secret !== 'string') return null;

      try {
        // 2. ADIM: Python Backend'e Hesaplama İçin Gönder
        // Not: snap.manifest.json dosyasında "endowment:network-access" izni olmalı.
        const response = await fetch('http://127.0.0.1:5000/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: secret, t: 3, n: 5 }), // Varsayılan: 3/5
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // 3. ADIM: Sonuçları Güvenli Pencerede (Snap Dialog) Göster
        // Web sitesi bu pencerenin içeriğini OKUYAMAZ.
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert', // 'alert' kullanıyoruz ki kullanıcı 'OK' diyene kadar kapanmasın
            content: (
              <Box>
                <Heading>Shares Created Successfully</Heading>
                <Text>
                  Please copy these shares manually.
                  <Bold> For your security, these are NOT saved to the website.</Bold>
                </Text>
                <Divider />

                {/* Gelen Share Listesini Ekrana Basıyoruz */}
                {data.shares.map((share: string, index: number) => (
                  <Box>
                    <Text><Bold>Share #{String(index + 1)}</Bold></Text>
                    <Copyable value={share} />
                    <Divider />
                  </Box>
                ))}

                <Text>
                  Once you close this window, these shares will be lost from memory.
                </Text>
              </Box>
            ),
          },
        });

        // 4. KRİTİK NOKTA: Web Sitesine Veri DÖNDÜRMÜYORUZ
        // Sadece işlemin başarılı olduğunu söylüyoruz.
        return { success: true };

      } catch (error) {
        // Hata durumunda kullanıcıyı bilgilendir
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <Box>
                <Heading>Error</Heading>
                <Text>Something went wrong during the split process.</Text>
                <Text>{String(error)}</Text>
              </Box>
            ),
          },
        });
        throw new Error(String(error));
      }

    default:
      throw new Error('Method not found.');
  }
};
