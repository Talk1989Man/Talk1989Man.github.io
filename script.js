// Vigenère cipher, worked the way you would on paper:
// letters are turned into positions in the alphabet (a=0 .. z=25),
// added or subtracted mod 26, then turned back into letters.
// Everything is treated as lowercase; anything that isn't a letter is
// copied through untouched and does NOT advance the key.

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

function letterIndex(ch) {
  return ALPHABET.indexOf(ch.toLowerCase()); // -1 if not a letter
}

function cipher(text, key, direction) {
  const keyIndices = [];
  for (const ch of key) {
    const i = letterIndex(ch);
    if (i !== -1) keyIndices.push(i);
  }
  if (keyIndices.length === 0) return "";

  let out = "";
  let keyPos = 0;

  for (const ch of text) {
    const i = letterIndex(ch);
    if (i === -1) {
      out += ch; // space, punctuation, digit — passes through
      continue;
    }
    const shift = keyIndices[keyPos % keyIndices.length];
    // + 26 keeps the result non-negative when decrypting
    const shifted = (i + direction * shift + 26) % 26;
    out += ALPHABET[shifted];
    keyPos++;
  }
  return out;
}

const encrypt = (text, key) => cipher(text, key, 1);
const decrypt = (text, key) => cipher(text, key, -1);

// --- UI -------------------------------------------------------------

const els = {
  tabs: document.querySelectorAll(".tab"),
  text: document.getElementById("text"),
  textLabel: document.getElementById("text-label"),
  key: document.getElementById("key"),
  keyHint: document.getElementById("key-hint"),
  run: document.getElementById("run"),
  processing: document.getElementById("processing"),
  procLog: document.getElementById("proc-log"),
  meterFill: document.getElementById("meter-fill"),
  procPct: document.getElementById("proc-pct"),
  noteOverlay: document.getElementById("note-overlay"),
  noteTitle: document.getElementById("note-title"),
  noteText: document.getElementById("note-text"),
  noteClose: document.getElementById("note-close"),
  copy: document.getElementById("copy"),
};

let mode = "encrypt";

function setMode(next) {
  mode = next;
  const encrypting = mode === "encrypt";

  els.tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  els.textLabel.textContent = encrypting ? "Plaintext" : "Ciphertext";
  els.text.placeholder = encrypting
    ? "ENTER SECRET MESSAGE HERE"
    : "ENTER ENCRYPTED MESSAGE HERE";
  els.run.textContent = encrypting ? "Encrypt" : "Decrypt";
}

// --- The show -------------------------------------------------------
// None of this does any real work. The answer is ready the instant the
// button is pressed; the machine just makes a fuss about it first.

const STEPS = [
  "Analyzing characters",
  "Calculating {mode} pattern",
  "Activating neurons",
  "Installing Vigenère secret",
  "Writing to memory",
  "Last touches...",
];

const rand = (min, max) => min + Math.random() * (max - min);

let showTimer = null;

function runShow(onDone) {
  const word = mode === "encrypt" ? "encryption" : "decryption";
  const steps = STEPS.map((step) => step.replace("{mode}", word));
  const total = rand(2600, 5200); // every run takes a different amount of time
  const started = performance.now();

  els.procLog.textContent = "";
  els.meterFill.style.width = "0%";
  els.procPct.textContent = "0";
  els.processing.hidden = false;
  document.body.classList.add("locked");

  let percent = 0;
  let logged = -1;

  function tick() {
    // Creep forward in uneven jumps, so it looks like it's thinking.
    const elapsed = performance.now() - started;
    const target = Math.min(99, (elapsed / total) * 100);
    percent = Math.max(percent, Math.min(99, target + rand(-4, 6)));

    els.meterFill.style.width = percent + "%";
    els.procPct.textContent = Math.floor(percent);

    // Log each step as the bar passes its share of the way.
    const stepNow = Math.min(steps.length - 1, Math.floor((percent / 100) * steps.length));
    while (logged < stepNow) {
      logged++;
      const li = document.createElement("li");
      li.textContent = steps[logged];
      els.procLog.appendChild(li);
      // Mark the previous step finished.
      if (logged > 0) els.procLog.children[logged - 1].classList.add("done");
    }

    if (elapsed >= total) {
      els.meterFill.style.width = "100%";
      els.procPct.textContent = "100";
      els.procLog.lastElementChild?.classList.add("done");
      showTimer = setTimeout(() => {
        els.processing.hidden = true;
        onDone();
      }, 450); // a beat on 100% before the reveal
      return;
    }

    showTimer = setTimeout(tick, rand(90, 260));
  }

  tick();
}

function showNote(message) {
  els.noteTitle.textContent =
    mode === "encrypt" ? "Encrypted Message" : "Decrypted Message";
  els.noteText.textContent = message;
  els.noteOverlay.hidden = false;
  document.body.classList.add("locked");
  els.noteClose.focus();
}

function closeNote() {
  els.noteOverlay.hidden = true;
  document.body.classList.remove("locked");
  els.copy.textContent = "Copy";
  els.run.focus();
}

function run() {
  if (showTimer !== null) return; // already putting on a show

  const key = els.key.value;
  const hasKeyLetter = [...key].some((ch) => letterIndex(ch) !== -1);

  if (!els.text.value.trim()) {
    fail("Type a message first.");
    return;
  }
  if (!hasKeyLetter) {
    fail("The key needs at least one letter.");
    return;
  }

  els.keyHint.classList.remove("error");
  els.keyHint.textContent = "";

  const message =
    mode === "encrypt"
      ? encrypt(els.text.value, key)
      : decrypt(els.text.value, key);

  runShow(() => {
    showTimer = null;
    showNote(message);
  });
}

function fail(msg) {
  els.keyHint.textContent = msg;
  els.keyHint.classList.add("error");
}

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

els.run.addEventListener("click", run);

// Typing again clears a complaint from the last attempt.
[els.text, els.key].forEach((el) => {
  el.addEventListener("input", () => {
    els.keyHint.textContent = "";
    els.keyHint.classList.remove("error");
  });
});
els.noteClose.addEventListener("click", closeNote);

// Clicking the dark area around the note closes it too.
els.noteOverlay.addEventListener("click", (e) => {
  if (e.target === els.noteOverlay) closeNote();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.noteOverlay.hidden) closeNote();
});

els.copy.addEventListener("click", async () => {
  const value = els.noteText.textContent;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // clipboard API blocked (e.g. file:// in some browsers)
    const tmp = document.createElement("textarea");
    tmp.value = value;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand("copy");
    tmp.remove();
  }
  els.copy.textContent = "Copied";
  setTimeout(() => (els.copy.textContent = "Copy"), 1200);
});

setMode("encrypt");
