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
        
        console.log('=== NFC Card Detected ===');
        console.log('Serial Number:', serialNumber);
        console.log('NDEF Message:', JSON.stringify(message, null, 2));
        
        try {
          // Parse NDEF message to extract balance
          // This is a placeholder implementation
          // Actual implementation depends on YBS card data format
          let balance: number | undefined;
          let cardId = serialNumber;

          console.log('Number of records:', message.records.length);
          
          for (let i = 0; i < message.records.length; i++) {
            const record = message.records[i];
            console.log(`\n--- Record ${i} ---`);
            console.log('Record type:', record.recordType);
            console.log('Record TNF (Type Name Format):', record.tnf);
            console.log('Record data type:', typeof record.data);
            console.log('Record data:', record.data);
            
            // Log data details based on type
            if (record.data instanceof ArrayBuffer) {
              console.log('Data is ArrayBuffer, size:', record.data.byteLength);
              const bytes = new Uint8Array(record.data);
              console.log('Bytes:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
              console.log('Bytes as string:', Array.from(bytes).map(b => String.fromCharCode(b)).join(''));
            } else if (typeof record.data === 'string') {
              console.log('Data is string, length:', record.data.length);
            } else {
              console.log('Data is other type:', Object.prototype.toString.call(record.data));
            }

            // Check if this is a text record
            if (record.recordType === 'text') {
              let text = '';
              
              // Handle different data formats (ArrayBuffer, string, etc.)
              if (record.data instanceof ArrayBuffer) {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                text = textDecoder.decode(record.data);
              } else if (typeof record.data === 'string') {
                text = record.data;
              } else if (record.data && record.data.buffer instanceof ArrayBuffer) {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                text = textDecoder.decode(record.data);
              } else {
                // Try to convert to string
                text = String(record.data);
              }
              
              console.log('Text content:', text);

              // Try to extract balance from text
              // Format might be: "BALANCE:5000" or similar
              const balanceMatch = text.match(/BALANCE[:\s]*(\d+)/i);
              if (balanceMatch) {
                balance = parseInt(balanceMatch[1], 10);
                console.log('Extracted balance from BALANCE pattern:', balance);
              }

              // YBS card format: "card No 1118 1010 1100 5206 184"
              // Full card ID: "1118101011005206184" (all numbers concatenated)
              // Format: card No [cardIdPart1] [cardIdPart2] [cardIdPart3] [balance] [extra]
              // Balance is the 5th value (index 5), card ID is full concatenated number
              if (text.toLowerCase().startsWith('card no')) {
                const parts = text.split(/\s+/);
                if (parts.length >= 6) {
                  // Example: ["card", "No", "1118", "1010", "1100", "5206", "184"]
                  // Full card ID = "1118101011005206184"
                  const balanceValue = parts[5];
                  const cardIdFull = parts[2] + parts[3] + parts[4] + parts[5] + (parts[6] || '');
                  
                  // Validate that balance is a number
                  if (!isNaN(parseInt(balanceValue, 10))) {
                    balance = parseInt(balanceValue, 10);
                    cardId = cardIdFull;
                    console.log('Parsed YBS card - Balance:', balance, 'Card ID:', cardId);
                  }
                }
              } else {
                // Check if the text is just the full card ID (e.g., "1118101011005206184")
                // This is the concatenated card number without "card No" prefix
                const cleanText = text.replace(/[^0-9]/g, '');
                if (cleanText.length >= 16 && !isNaN(parseInt(cleanText, 10))) {
                  cardId = cleanText;
                  console.log('Parsed YBS card ID (direct):', cardId);
                  // Note: Balance cannot be extracted from the card ID alone
                  // It needs to be looked up from a backend service
                }
              }

              // Fallback: Try to find all numbers in the text and use the largest one as balance
              // This handles cases where the format might be slightly different
              if (balance === undefined) {
                const allNumbers = text.match(/\d+/g);
                if (allNumbers && allNumbers.length > 0) {
                  // Get the largest number that looks like a balance (typically 4-6 digits)
                  const candidateBalances = allNumbers
                    .map(n => parseInt(n, 10))
                    .filter(n => n >= 100 && n <= 999999);
                  
                  if (candidateBalances.length > 0) {
                    // Use the largest number as the balance (assuming it's the balance)
                    balance = Math.max(...candidateBalances);
                    console.log('Fallback: Extracted balance from numbers:', balance, 'All numbers:', allNumbers);
                  }
                }
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
            // If we couldn't parse balance, return card ID at least with debug info
            console.log('Could not parse balance from card data. Card ID:', cardId);
            resolve({
              success: false,
              cardId,
              error: 'Could not read balance from card. The card format may not be supported yet. Check console for raw data.',
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
