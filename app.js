// app.js
import {
  BLOCKS,
  DEVICE_TYPES,
  PRINTER_TYPES,
  OPERATING_SYSTEMS,
  SECURITY_OPTIONS
} from "./data.js?v=500";

const el = (id) => document.getElementById(id);

const form = el("invForm");
const deviceType = el("deviceType");
const block = el("block");
const floor = el("floor");

const printerTypeWrap = el("printerTypeWrap");
const printerType = el("printerType");

const equipment = el("equipment");
const serialInput = el("serialInput");
const serialLabel = el("serialLabel");
const serialHint = el("serialHint");

const os = el("os");
const security = el("security");
const preview = el("preview");

// ✅ YOUR GOOGLE APPS SCRIPT WEB APP URL
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxEEnZwnWYXQMKkUbzVwoVGemtP-qcvzs02s4le1S0xy1oVXrDJ7Eq4WZl97PfrW7o/exec";

// Keep serials even when switching equipment dropdown
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

// ===============================
// BLOCK → FLOOR LOGIC (DOSH => N/A)
// ===============================
function updateFloors() {
  const b = block.value;
  const floors = BLOCKS[b]?.floors ?? [];

  if (floors.length === 0) {
    floor.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "N/A";
    opt.textContent = "N/A";
    opt.selected = true;
    floor.appendChild(opt);

    floor.disabled = true;
    floor.required = false;
  } else {
    fillSelect(floor, floors, "Select Floor");
    floor.disabled = false;
    floor.required = true;
  }
}

// ===============================
// PRINTER TYPE VISIBILITY
// ===============================
function updatePrinterTypeVisibility() {
  if (deviceType.value === "Printer") {
    printerTypeWrap.style.display = "block";
    fillSelect(printerType, PRINTER_TYPES, "Select Printer Type");
    printerType.required = true;
  } else {
    printerTypeWrap.style.display = "none";
    printerType.required = false;
    printerType.innerHTML = "";
  }
}

// ===============================
// EQUIPMENT SERIAL LOGIC
// ===============================
function updateEquipmentOptions() {
  const t = deviceType.value;

  if (t === "Laptop") {
    fillSelect(equipment, ["Laptop"]);
    equipment.value = "Laptop";
    serialHint.textContent = "";
  } else if (t === "Printer") {
    fillSelect(equipment, ["Printer"]);
    equipment.value = "Printer";
    serialHint.textContent = "Select printer type above, then enter the serial number.";
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

// ===============================
// CREATE ROW OBJECT
// ===============================
function makeRow() {
  const t = deviceType.value;

  return {
    username: el("username").value.trim(),
    deviceType: t,
    printerType: t === "Printer" ? (printerType.value || "") : "",

    block: block.value,
    floor: floor.disabled ? "N/A" : (floor.value || ""),
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

// ===============================
// VALIDATION
// ===============================
function validateBeforeSave() {
  const t = deviceType.value;

  if (!el("username").value.trim()) return "Username is required.";
  if (!t) return "Device Type is required.";
  if (!block.value) return "Block is required.";

  if (!floor.disabled && !floor.value) return "Floor is required.";
  if (t === "Printer" && !printerType.value) return "Printer Type is required.";
  if (!os.value) return "Operating System is required.";
  if (!security.value) return "Security is required.";

  if (t === "Desktop Computer" && (!serialState.cpu || !serialState.monitor)) {
    return "Desktop Computer requires BOTH CPU and Monitor serial numbers.";
  }
  if (t === "Laptop" && !serialState.laptop) return "Laptop serial number is required.";
  if (t === "Printer" && !serialState.printer) return "Printer serial number is required.";

  return null;
}

function resetFormForNextEntry() {
  el("username").value = "";
  el("room").value = "";

  printerTypeWrap.style.display = "none";
  printerType.innerHTML = "";

  serialState.laptop = "";
  serialState.printer = "";
  serialState.cpu = "";
  serialState.monitor = "";
  serialInput.value = "";

  preview.textContent = JSON.stringify(makeRow(), null, 2);
}

// ===============================
// INIT
// ===============================
fillSelect(deviceType, DEVICE_TYPES, "Select Device Type");
fillSelect(block, Object.keys(BLOCKS), "Select Block");
fillSelect(os, OPERATING_SYSTEMS, "Select OS");
fillSelect(security, SECURITY_OPTIONS, "Select Security");

preview.textContent = JSON.stringify(makeRow(), null, 2);

// ===============================
// EVENTS
// ===============================
block.addEventListener("change", () => {
  updateFloors();
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

deviceType.addEventListener("change", () => {
  updatePrinterTypeVisibility();
  updateEquipmentOptions();
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

printerType?.addEventListener("change", () => {
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

equipment.addEventListener("change", () => {
  syncSerialInput();
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

form.addEventListener("input", () => {
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

// ✅ SUBMIT: send to Google Sheets using FormData + no-cors (most reliable)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const err = validateBeforeSave();
  if (err) return alert(err);

  const row = makeRow();

  // FormData avoids JSON/CORS headaches
  const fd = new FormData();
  Object.entries(row).forEach(([k, v]) => fd.append(k, v ?? ""));

  try {
    await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      body: fd
    });

    // We can't read response in no-cors, but submission should be written.
    alert("Submitted ✅ Check the Google Sheet for the new row.");
    resetFormForNextEntry();
  } catch (error) {
    alert("Error submitting. Confirm the Web App is deployed as 'Anyone' and redeployed.");
    console.error(error);
  }
});