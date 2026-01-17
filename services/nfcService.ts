// Web NFC API service for reading YBS card balance
// Note: Web NFC API is experimental and only works in Chrome/Edge on Android with HTTPS

export interface NFCReadResult {
  success: boolean;
  balance?: number;
  cardId?: string;
  error?: string;
}

export const isNFCSupported = (): boolean => {
  return 'NDEFReader' in window;
};

export const checkNFCPermission = async (): Promise<boolean> => {
  if (!isNFCSupported()) {
    return false;
  }

  try {
    // Check if we have permission (this is implicit in Web NFC)
    return true;
  } catch (error) {
    console.error('NFC permission check failed:', error);
    return false;
  }
};

export const readNFCCard = async (): Promise<NFCReadResult> => {
  if (!isNFCSupported()) {
    return {
      success: false,
      error: 'NFC is not supported on this device or browser. Please use Chrome/Edge on Android with HTTPS.',
    };
  }

  try {
    // @ts-ignore - Web NFC API is experimental
    const ndef = new NDEFReader();
    
    // Start scanning
    await ndef.scan();
    
    console.log('NFC scan started. Please tap your YBS card...');

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: 'NFC read timeout. Please try again.',
        });
      }, 30000); // 30 second timeout

      ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
        clearTimeout(timeout);
        
        console.log('NFC card detected:', serialNumber);
        console.log('NDEF message:', message);

        try {
          // Parse NDEF message to extract balance
          // This is a placeholder implementation
          // Actual implementation depends on YBS card data format
          let balance: number | undefined;
          let cardId = serialNumber;

          for (const record of message.records) {
            console.log('Record type:', record.recordType);
            console.log('Record data:', record.data);

            // Check if this is a text record
            if (record.recordType === 'text') {
              const textDecoder = new TextDecoder(record.encoding || 'utf-8');
              const text = textDecoder.decode(record.data);
              console.log('Text content:', text);

              // Try to extract balance from text
              // Format might be: "BALANCE:5000" or similar
              const balanceMatch = text.match(/BALANCE[:\s]*(\d+)/i);
              if (balanceMatch) {
                balance = parseInt(balanceMatch[1], 10);
              }
            }

            // Check for URL or other record types that might contain balance info
            if (record.recordType === 'url') {
              const textDecoder = new TextDecoder('utf-8');
              const url = textDecoder.decode(record.data);
              console.log('URL content:', url);
              
              // Extract balance from URL parameters if present
              const urlMatch = url.match(/balance=(\d+)/i);
              if (urlMatch) {
                balance = parseInt(urlMatch[1], 10);
              }
            }

            // For unknown/proprietary formats, log the hex data
            if (record.recordType === 'unknown' || record.recordType === 'empty') {
              const dataArray = new Uint8Array(record.data);
              const hexString = Array.from(dataArray)
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ');
              console.log('Raw data (hex):', hexString);
              
              // You might need to parse this based on YBS card specification
              // This is a placeholder for custom parsing logic
            }
          }

          if (balance !== undefined) {
            resolve({
              success: true,
              balance,
              cardId,
            });
          } else {
            // If we couldn't parse balance, return card ID at least
            resolve({
              success: false,
              cardId,
              error: 'Could not read balance from card. The card format may not be supported yet.',
            });
          }
        } catch (parseError) {
          console.error('Error parsing NFC data:', parseError);
          resolve({
            success: false,
            error: 'Failed to parse card data. Please try manual input.',
          });
        }
      });

      ndef.addEventListener('readingerror', () => {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: 'Error reading NFC card. Please try again.',
        });
      });
    });
  } catch (error: any) {
    console.error('NFC read error:', error);
    
    let errorMessage = 'Failed to read NFC card.';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'NFC permission denied. Please allow NFC access and try again.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'NFC is not supported on this device.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Mock function for testing without NFC hardware
export const mockNFCRead = (): Promise<NFCReadResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        balance: Math.floor(Math.random() * 10000) + 1000,
        cardId: 'MOCK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      });
    }, 1500);
  });
};

export const writeNFCCard = async (data: string): Promise<boolean> => {
  if (!isNFCSupported()) {
    return false;
  }

  try {
    // @ts-ignore
    const ndef = new NDEFReader();
    
    await ndef.write({
      records: [{ recordType: 'text', data }]
    });
    
    return true;
  } catch (error) {
    console.error('NFC write error:', error);
    return false;
  }
};
