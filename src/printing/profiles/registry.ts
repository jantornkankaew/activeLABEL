import type {PrinterProfile} from '../types';

export const BUILTIN_PROFILES: PrinterProfile[] = [
  {
    id: 'generic-tspl-203',
    name: 'Generic TSPL (203 DPI) · Xprinter / TSC / Gprinter',
    language: 'tspl',
    dpi: 203,
    printableWidthMm: 80,
    labelPresets: [
      {widthMm: 50, heightMm: 30, gapMm: 2},
      {widthMm: 40, heightMm: 30, gapMm: 2},
      {widthMm: 55, heightMm: 35, gapMm: 2},
      {widthMm: 100, heightMm: 75, gapMm: 2},
      {widthMm: 100, heightMm: 150, gapMm: 2},
    ],
    transports: [
      {type: 'usb'},
      {type: 'serial', baudRate: 115200},
      {type: 'ble'},
    ],
    options: {
      invertBitmap: true,
      darkness: 8,
      speed: 4,
      offsetXDots: 0,
      offsetYDots: 0,
      chunkSize: 4096,
      lineEnding: '\r\n',
    },
  },
  {
    id: 'generic-tspl-300',
    name: 'Generic TSPL (300 DPI) · High-res TSC / Xprinter',
    language: 'tspl',
    dpi: 300,
    printableWidthMm: 80,
    labelPresets: [
      {widthMm: 50, heightMm: 30, gapMm: 2},
      {widthMm: 55, heightMm: 35, gapMm: 2},
    ],
    transports: [
      {type: 'usb'},
      {type: 'serial', baudRate: 115200},
    ],
    options: {
      invertBitmap: true,
      darkness: 8,
      speed: 3,
      offsetXDots: 0,
      offsetYDots: 0,
      chunkSize: 4096,
      lineEnding: '\r\n',
    },
  },
  {
    id: 'generic-zpl-203',
    name: 'Generic ZPL II (203 DPI) · Zebra & Compatible',
    language: 'zpl',
    dpi: 203,
    printableWidthMm: 104,
    labelPresets: [
      {widthMm: 100, heightMm: 150, gapMm: 3},
      {widthMm: 50, heightMm: 30, gapMm: 2},
      {widthMm: 55, heightMm: 35, gapMm: 2},
    ],
    transports: [
      {type: 'usb'},
      {type: 'serial', baudRate: 9600},
      {type: 'bridge', bridgeUrl: 'http://127.0.0.1:28171'},
    ],
    options: {
      invertBitmap: false,
      darkness: 15,
      speed: 4,
      offsetXDots: 0,
      offsetYDots: 0,
    },
  },
  {
    id: 'generic-zpl-300',
    name: 'Generic ZPL II (300 DPI) · Zebra & Compatible',
    language: 'zpl',
    dpi: 300,
    printableWidthMm: 104,
    labelPresets: [
      {widthMm: 100, heightMm: 150, gapMm: 3},
      {widthMm: 50, heightMm: 30, gapMm: 2},
      {widthMm: 55, heightMm: 35, gapMm: 2},
    ],
    transports: [
      {type: 'usb'},
      {type: 'serial', baudRate: 9600},
    ],
    options: {
      invertBitmap: false,
      darkness: 15,
      speed: 3,
      offsetXDots: 0,
      offsetYDots: 0,
    },
  },
  {
    id: 'xprinter-xp-365b',
    name: 'Xprinter XP-365B (203 DPI)',
    language: 'tspl',
    dpi: 203,
    printableWidthMm: 80,
    labelPresets: [
      {widthMm: 50, heightMm: 30, gapMm: 2},
      {widthMm: 40, heightMm: 30, gapMm: 2},
      {widthMm: 55, heightMm: 35, gapMm: 2},
    ],
    transports: [
      {type: 'usb', vendorId: '0x0483', productId: '0x5740'},
      {type: 'serial', baudRate: 115200},
    ],
    options: {
      invertBitmap: true,
      darkness: 8,
      speed: 4,
      chunkSize: 4096,
      lineEnding: '\r\n',
    },
    testedWith: {
      os: 'Windows 11 / macOS',
      browser: 'Chrome 130',
      verifiedBy: 'activeLABEL Community',
      date: '2026-10-18',
    },
  },
  {
    id: 'xprinter-xp-420b',
    name: 'Xprinter XP-420B (203 DPI / 108 mm)',
    language: 'tspl',
    dpi: 203,
    printableWidthMm: 108,
    labelPresets: [
      {widthMm: 100, heightMm: 150, gapMm: 3},
      {widthMm: 100, heightMm: 75, gapMm: 2},
    ],
    transports: [
      {type: 'usb'},
      {type: 'serial', baudRate: 115200},
    ],
    options: {
      invertBitmap: true,
      darkness: 9,
      speed: 5,
      chunkSize: 4096,
      lineEnding: '\r\n',
    },
    testedWith: {
      os: 'Windows 11',
      browser: 'Chrome 130',
      verifiedBy: 'activeLABEL Community',
      date: '2026-10-18',
    },
  },
  {
    id: 'zebra-zd220',
    name: 'Zebra ZD220 / ZD230 (203 DPI)',
    language: 'zpl',
    dpi: 203,
    printableWidthMm: 104,
    labelPresets: [
      {widthMm: 100, heightMm: 150, gapMm: 3},
      {widthMm: 50, heightMm: 30, gapMm: 2},
    ],
    transports: [
      {type: 'usb'},
      {type: 'serial', baudRate: 9600},
    ],
    options: {
      invertBitmap: false,
      darkness: 15,
      speed: 4,
    },
    testedWith: {
      os: 'Windows 11 / macOS',
      browser: 'Chrome 130',
      verifiedBy: 'activeLABEL Community',
      date: '2026-10-18',
    },
  },
];

const USER_PROFILES_STORAGE_KEY = 'activelabel_user_printer_profiles';

export function getAllProfiles(): PrinterProfile[] {
  let customProfiles: PrinterProfile[] = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(USER_PROFILES_STORAGE_KEY);
      if (stored) {
        customProfiles = JSON.parse(stored);
      }
    } catch {
      // Ignore storage parse error
    }
  }

  // Combine built-in profiles and custom profiles (custom overrides built-in by ID)
  const map = new Map<string, PrinterProfile>();
  for (const p of BUILTIN_PROFILES) {
    map.set(p.id, p);
  }
  for (const p of customProfiles) {
    map.set(p.id, p);
  }
  return Array.from(map.values());
}

export function getProfileById(id: string): PrinterProfile | undefined {
  return getAllProfiles().find(p => p.id === id);
}

export function saveUserProfile(profile: PrinterProfile): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const current = getUserCustomProfiles();
  const index = current.findIndex(p => p.id === profile.id);
  if (index >= 0) {
    current[index] = profile;
  } else {
    current.push(profile);
  }
  localStorage.setItem(USER_PROFILES_STORAGE_KEY, JSON.stringify(current));
}

export function getUserCustomProfiles(): PrinterProfile[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const stored = localStorage.getItem(USER_PROFILES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
