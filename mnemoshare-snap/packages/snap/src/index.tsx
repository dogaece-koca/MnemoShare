import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Divider, Copyable, Bold } from '@metamask/snaps-sdk/jsx';

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  switch (request.method) {
    case 'split_secret':
      // 1. Request Secret
      const secret = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'prompt',
          content: (
            <Box>
              <Heading>MnemoShare 🔐</Heading>
              <Text>
                Paste your secret key below.
                <Bold> Data will be split and deleted from the server.</Bold>
              </Text>
            </Box>
          ),
          placeholder: 'Secret Key...',
        },
      });

      if (!secret || typeof secret !== 'string') return null;

      try {
        // 2. Send to Python Backend
        const response = await fetch('http://127.0.0.1:5000/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: secret, t: 3, n: 5 }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // 3. Notify User (Text Only)
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <Box>
                <Heading>Success! 🎉</Heading>
                <Text>Shares created. Return to the website to view QR Codes.</Text>
              </Box>
            ),
          },
        });

        // 4. CRITICAL POINT: Return Data back to Website
        return { shares: data.shares };

      } catch (error) {
        throw new Error(String(error));
      }

    default:
      throw new Error('Method not found.');
  }
};
