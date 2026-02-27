// data.js
export const BLOCKS = {
  "Block A": { floors: ["2", "4", "5", "6", "7", "8", "14", "22"] },
  "Block B": { floors: ["14", "15"] },
  "Block C": { floors: ["23", "5", "6", "7"] },

  // ✅ New option: DOSH has NO floors
  "DOSH": { floors: [] }
};

export const DEVICE_TYPES = ["Laptop", "Desktop Computer", "Printer"];

// ✅ Printer sub-types
export const PRINTER_TYPES = ["All-in-One", "LaserJet"];

export const OPERATING_SYSTEMS = [
  "Windows 11",
  "Windows 10",
  "Windows 8",
  "Windows 7",
  "Ubuntu",
  "macOS",
  "Other"
];

export const SECURITY_OPTIONS = ["Antivirus", "XDR", "None"];