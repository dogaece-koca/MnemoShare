import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Divider, Copyable, Bold } from '@metamask/snaps-sdk/jsx';

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  switch (request.method) {
    case 'split_secret':

      const params = request.params as { t?: number; n?: number } || {};
      const t_value = params.t || 3;
      const n_value = params.n || 5;

      // 2. ADIM: Kullanıcıdan Sırrı İste (Prompt)
      const secret = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'prompt',
          content: (
            <Box>
              <Heading>MnemoShare</Heading>
              <Text>
                Please paste your Master Secret below.
                <Bold> It will be processed securely based on your selected ({String(t_value)}-of-{String(n_value)}) scheme.</Bold>
              </Text>
            </Box>
          ),
          placeholder: 'Enter your mnemonic or private key...',
        },
      });

      if (!secret || typeof secret !== 'string') return null;

      try {

        const response = await fetch('http://127.0.0.1:5000/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: secret,
            t: t_value,  // Kullanıcının seçimi
            n: n_value   // Kullanıcının seçimi
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // 4. ADIM: Sonuçları Göster
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <Box>
                <Heading>Shares Created Successfully</Heading>
                <Text>
                   Scheme Applied: <Bold>({String(t_value)}-of-{String(n_value)})</Bold>
                </Text>
                <Text>
                  Please copy these shares manually.
                  <Bold> For your security, these are NOT saved to the website.</Bold>
                </Text>
                <Divider />

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

        return { success: true };

      } catch (error) {
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
