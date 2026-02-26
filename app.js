import { BLOCKS, DEVICE_TYPES, OPERATING_SYSTEMS, SECURITY_OPTIONS } from "./data.js";

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

// Store serials safely even when user switches dropdown
const serialState = {
  laptop: "",
  printer: "",
  cpu: "",
  monitor: ""
};

function fillSelect(selectEl, options, includeBlank = false) {
  selectEl.innerHTML = "";
  if (includeBlank) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- optional --";
    selectEl.appendChild(opt);
  }
  for (const v of options) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  }
}

function updateFloorsAndRooms() {
  const b = block.value;
  const floors = BLOCKS[b]?.floors ?? [];
  fillSelect(floor, floors);
}

// ✅ Equipment dropdown depends on device type
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

  // update input to match selected equipment
  syncSerialInput();
}

// ✅ When equipment changes, load saved serial into the input
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

// ✅ Save serial input into correct slot as user types
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

function toCSV(obj) {
  const headers = Object.keys(obj);
  const values = headers.map((h) => String(obj[h]).replaceAll('"', '""'));
  return `${headers.join(",")}\n${values.map((v) => `"${v}"`).join(",")}\n`;
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

// Init
fillSelect(deviceType, DEVICE_TYPES);
fillSelect(block, Object.keys(BLOCKS));
fillSelect(os, OPERATING_SYSTEMS);
fillSelect(security, SECURITY_OPTIONS);

updateFloorsAndRooms();
updateEquipmentOptions();
preview.textContent = JSON.stringify(makeRow(), null, 2);

// Events
block.addEventListener("change", updateFloorsAndRooms);
deviceType.addEventListener("change", () => {
  updateEquipmentOptions();
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});
equipment.addEventListener("change", syncSerialInput);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const t = deviceType.value;

  // ✅ Enforce BOTH CPU + Monitor for Desktop Computer
  if (t === "Desktop Computer") {
    if (!serialState.cpu || !serialState.monitor) {
      alert("Desktop Computer requires BOTH CPU and Monitor serial numbers.");
      return;
    }
  }

  // ✅ Enforce serial for Laptop/Printer
  if (t === "Laptop" && !serialState.laptop) {
    alert("Laptop serial number is required.");
    return;
  }
  if (t === "Printer" && !serialState.printer) {
    alert("Printer serial number is required.");
    return;
  }

  const row = makeRow();
  const csv = toCSV(row);

  const safeUser = (row.username || "user").replace(/[^a-z0-9_-]/gi, "_");
  const file = `inventory_${safeUser}_${Date.now()}.csv`;

  downloadText(file, csv);
});