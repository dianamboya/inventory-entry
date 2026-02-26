import { BLOCKS, DEVICE_TYPES, OPERATING_SYSTEMS, SECURITY_OPTIONS } from "./data.js";

const el = (id) => document.getElementById(id);

const form = el("invForm");
const deviceType = el("deviceType");
const block = el("block");
const floor = el("floor");
const room = el("room");
const os = el("os");
const security = el("security");

const singleSerialWrap = el("singleSerialWrap");
const desktopSerialWrap = el("desktopSerialWrap");

const preview = el("preview");

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

  updateRooms();
}

function updateRooms() {
  const b = block.value;
  const f = floor.value;

  const rooms = (BLOCKS[b]?.rooms?.[f] ?? []).filter(Boolean);
  fillSelect(room, rooms, true); // optional
}

function updateSerialFields() {
  const t = deviceType.value;

  singleSerialWrap.classList.add("hidden");
  desktopSerialWrap.classList.add("hidden");

  // reset required flags
  el("deviceSerial").required = false;
  el("cpuSerial").required = false;
  el("monitorSerial").required = false;

  if (t === "Laptop" || t === "Printer") {
    singleSerialWrap.classList.remove("hidden");
    el("deviceSerial").required = true;
  } else if (t === "Desktop Computer") {
    desktopSerialWrap.classList.remove("hidden");
    el("cpuSerial").required = true;
    el("monitorSerial").required = true;
  }
}

function makeRow() {
  const t = deviceType.value;

  return {
    username: el("username").value.trim(),
    deviceType: t,
    block: block.value,
    floor: floor.value,
    room: room.value || "",
    laptopOrPrinterSerial: (t === "Laptop" || t === "Printer") ? el("deviceSerial").value.trim() : "",
    cpuSerial: (t === "Desktop Computer") ? el("cpuSerial").value.trim() : "",
    monitorSerial: (t === "Desktop Computer") ? el("monitorSerial").value.trim() : "",
    os: os.value,
    security: security.value,
    timestamp: new Date().toISOString()
  };
}

function toCSV(obj) {
  const headers = Object.keys(obj);
  const values = headers.map(h => String(obj[h]).replaceAll('"', '""'));
  return `${headers.join(",")}\n${values.map(v => `"${v}"`).join(",")}\n`;
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
updateSerialFields();

block.addEventListener("change", updateFloorsAndRooms);
floor.addEventListener("change", updateRooms);
deviceType.addEventListener("change", updateSerialFields);

form.addEventListener("input", () => {
  preview.textContent = JSON.stringify(makeRow(), null, 2);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const row = makeRow();
  const csv = toCSV(row);

  const safeUser = (row.username || "user").replace(/[^a-z0-9_-]/gi, "_");
  const file = `inventory_${safeUser}_${Date.now()}.csv`;

  downloadText(file, csv);
});