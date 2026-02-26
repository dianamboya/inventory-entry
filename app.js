// app.js
import { BLOCKS, DEVICE_TYPES, OPERATING_SYSTEMS, SECURITY_OPTIONS } from "./data.js?v=3";

const el = (id) => document.getElementById(id);

const form = el("invForm");
const deviceType = el("deviceType");
const block = el("block");
const floor = el("floor");
const equipment = el("equipment");
const serialInput = el("serialInput");
const serialLabel = el("serialLabel");
const serialHint = el("serialHint");
const os = el("os");
const security = el("security");
const preview = el("preview");

const downloadMasterBtn = el("downloadMasterBtn");
const clearEntriesBtn = el("clearEntriesBtn");
const countInfo = el("countInfo");

const STORAGE_KEY = "inventory_entries_v1";

// keep serials even when switching equipment
const serialState = { laptop: "", printer: "", cpu: "", monitor: "" };

function fillSelect(selectEl, options, placeholderText = null) {
  selectEl.innerHTML = "";

  if (placeholderText) {
    const p = document.createElement("option");
    p.value = "";
    p.textContent = placeholderText;
    p.disabled = true;
    p.selected = true;
    selectEl.appendChild(p);
  }

  for (const v of options) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  }
}

function updateFloors() {
  const b = block.value;
  const floors = BLOCKS[b]?.floors ?? [];
  fillSelect(floor, floors, "Select Floor");
}

function updateEquipmentOptions() {
  const t = deviceType.value;

  if (t === "Laptop") {
    fillSelect(equipment, ["Laptop"]);
    equipment.value = "Laptop";
    serialHint.textContent = "";
  } else if (t === "Printer") {
    fillSelect(equipment, ["Printer"]);
    equipment.value = "Printer";
    serialHint.textContent = "";
  } else if (t === "Desktop Computer") {
    fillSelect(equipment, ["CPU", "Monitor"]);
    equipment.value = "CPU";
    serialHint.textContent = "For Desktop Computer, you must enter BOTH CPU and Monitor serial numbers.";
  }

  syncSerialInput();
}

function syncSerialInput() {
  const eq = equipment.value;

  if (eq === "Laptop") {
    serialLabel.firstChild.textContent = "Laptop Serial Number";
    serialInput.value = serialState.laptop;
    serialInput.required = true;
    serialInput.placeholder = "Enter laptop serial";
  } else if (eq === "Printer") {
    serialLabel.firstChild.textContent = "Printer Serial Number";
    serialInput.value = serialState.printer;
    serialInput.required = true;
    serialInput.placeholder = "Enter printer serial";
  } else if (eq === "CPU") {
    serialLabel.firstChild.textContent = "CPU Serial Number";
    serialInput.value = serialState.cpu;
    serialInput.required = true;
    serialInput.placeholder = "Enter CPU serial";
  } else if (eq === "Monitor") {
    serialLabel.firstChild.textContent = "Monitor Serial Number";
    serialInput.value = serialState.monitor;
    serialInput.required = true;
    serialInput.placeholder = "Enter monitor serial";
  }
}

serialInput.addEventListener("input", () => {
  const eq = equipment.value;
  const v = serialInput.value.trim();

  if (eq === "Laptop") serialState.laptop = v;
  if (eq === "Printer") serialState.printer = v;
  if (eq === "CPU") serialState.cpu = v;
  if (eq === "Monitor") serialState.monitor = v;

  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

function makeRow() {
  const t = deviceType.value;

  return {
    username: el("username").value.trim(),
    deviceType: t,
    block: block.value,
    floor: floor.value,
    room: el("room").value.trim() || "",

    laptopSerial: t === "Laptop" ? serialState.laptop : "",
    printerSerial: t === "Printer" ? serialState.printer : "",
    cpuSerial: t === "Desktop Computer" ? serialState.cpu : "",
    monitorSerial: t === "Desktop Computer" ? serialState.monitor : "",

    os: os.value,
    security: security.value,
    timestamp: new Date().toISOString()
  };
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  updateCount();
}

function updateCount() {
  const entries = loadEntries();
  if (countInfo) countInfo.textContent = `Saved entries: ${entries.length}`;
}

function validateBeforeSave() {
  const t = deviceType.value;

  if (!el("username").value.trim()) return "Username is required.";
  if (!deviceType.value) return "Device Type is required.";
  if (!block.value) return "Block is required.";
  if (!floor.value) return "Floor is required.";
  if (!os.value) return "Operating System is required.";
  if (!security.value) return "Security is required.";

  if (t === "Desktop Computer" && (!serialState.cpu || !serialState.monitor)) {
    return "Desktop Computer requires BOTH CPU and Monitor serial numbers.";
  }
  if (t === "Laptop" && !serialState.laptop) return "Laptop serial number is required.";
  if (t === "Printer" && !serialState.printer) return "Printer serial number is required.";

  return null;
}

function entriesToCSV(entries) {
  if (!entries.length) return "";

  // Keep consistent header order
  const headers = [
    "username", "deviceType", "block", "floor", "room",
    "laptopSerial", "printerSerial", "cpuSerial", "monitorSerial",
    "os", "security", "timestamp"
  ];

  const escape = (val) => `"${String(val ?? "").replaceAll('"', '""')}"`;

  const lines = [
    headers.join(","),
    ...entries.map((row) => headers.map((h) => escape(row[h])).join(","))
  ];

  return lines.join("\n") + "\n";
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetFormForNextEntry() {
  // keep block/device selections if you want; here we reset most fields
  el("username").value = "";
  el("room").value = "";
  serialState.laptop = "";
  serialState.printer = "";
  serialState.cpu = "";
  serialState.monitor = "";
  serialInput.value = "";
  preview.textContent = JSON.stringify(makeRow(), null, 2);
}

// INIT
fillSelect(deviceType, DEVICE_TYPES, "Select Device Type");
fillSelect(block, Object.keys(BLOCKS), "Select Block");
fillSelect(os, OPERATING_SYSTEMS, "Select OS");
fillSelect(security, SECURITY_OPTIONS, "Select Security");

preview.textContent = JSON.stringify(makeRow(), null, 2);
updateCount();

// EVENTS
block.addEventListener("change", () => {
  updateFloors();
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

deviceType.addEventListener("change", () => {
  updateEquipmentOptions();
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

equipment.addEventListener("change", () => {
  syncSerialInput();
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

form.addEventListener("input", () => {
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

// ✅ SUBMIT: save to master list (no per-entry download)
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const err = validateBeforeSave();
  if (err) {
    alert(err);
    return;
  }

  const row = makeRow();
  const entries = loadEntries();
  entries.push(row);
  saveEntries(entries);

  alert("Saved! Use 'Download Master CSV' when ready.");
  resetFormForNextEntry();
});

// ✅ Download combined CSV anytime
downloadMasterBtn?.addEventListener("click", () => {
  const entries = loadEntries();
  if (!entries.length) {
    alert("No saved entries yet.");
    return;
  }
  const csv = entriesToCSV(entries);
  downloadText(`inventory_master_${Date.now()}.csv`, csv);
});

// ✅ Clear saved entries
clearEntriesBtn?.addEventListener("click", () => {
  const entries = loadEntries();
  if (!entries.length) {
    alert("Nothing to clear.");
    return;
  }
  const ok = confirm("Clear all saved entries? This cannot be undone.");
  if (!ok) return;

  localStorage.removeItem(STORAGE_KEY);
  updateCount();
  alert("Cleared.");
});