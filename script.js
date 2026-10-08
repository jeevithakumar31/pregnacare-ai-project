/* ====== HOSPITAL SETTINGS: hospital management edits only this block ====== */
const HOSPITAL = {
  name: "City General Hospital",
  phone: "+0000000000",          // maternity ward / emergency number
};
/* ========================================================================== */

const $ = (id) => document.getElementById(id);
const KEY = "pregnacare_v2";

/* ---- safe storage (never crashes if blocked) ---- */
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch { return false; } }
let data = load();

/* ---- screens ---- */
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  $("resetBtn").hidden = !data.patient;
  window.scrollTo(0, 0);
}
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));
document.querySelectorAll(".hosp").forEach((e) => (e.textContent = HOSPITAL.name));
$("hospitalName").textContent = HOSPITAL.name + " · PregnaCare AI";
$("callBtn").href = "tel:" + HOSPITAL.phone;

/* ---- pregnancy maths ---- */
function calc(lmp) {
  const days = Math.floor((Date.now() - new Date(lmp).getTime()) / 86400000);
  const week = Math.floor(days / 7);
  const due = new Date(new Date(lmp).getTime() + 280 * 86400000);
  return { days, week, due, left: Math.max(0, 280 - days) };
}
const SIZES = [[8,"a raspberry"],[12,"a lime"],[16,"an avocado"],[20,"a banana"],[24,"an ear of corn"],[28,"an aubergine"],[32,"a squash"],[36,"a head of lettuce"],[41,"a small watermelon"]];
const sizeFor = (w) => (SIZES.find(([m]) => w <= m) || SIZES.at(-1))[1];
const trimester = (w) => (w < 13 ? "First trimester" : w < 28 ? "Second trimester" : "Third trimester");

const WEEK_INFO = {
  1: "Early pregnancy: start folic acid as advised by your doctor, avoid alcohol and smoking, and book your first antenatal visit.",
  2: "Energy often returns. Keep attending scheduled scans and blood tests, and eat a varied diet with iron- and calcium-rich foods.",
  3: "Your baby is growing fast. Sleep on your side, rest often, and begin learning the signs of labour and your birth plan options.",
};
const info = (w) => WEEK_INFO[w < 13 ? 1 : w < 28 ? 2 : 3];

/* ---- dashboard ---- */
function render() {
  const p = data.patient;
  if (!p) return show("welcome");
  const c = calc(p.lmp);
  if (c.week < 0 || c.week > 42) { data = {}; save(data); return show("details"); }
  $("hello").textContent = "Hello, " + p.name.split(" ")[0] + " 🌸";
  $("weekNum").textContent = c.week;
  $("tri").textContent = trimester(c.week);
  $("due").textContent = "Due about " + c.due.toDateString();
  $("left").textContent = Math.ceil(c.left / 7) + " weeks to go";
  $("size").textContent = "Baby is about the size of " + sizeFor(c.week);
  $("weekInfo").textContent = info(c.week) + (p.cond ? " Please follow your doctor's advice for: " + p.cond + "." : "");
  renderChecklist(); renderReminders(); renderKicks(); renderNames(); renderAfter(); newAffirmation(); newGame();
  show("dashboard");
}

/* ---- daily checklist (resets each day) ---- */
const TASKS = ["Drink 8 glasses of water","Take supplements prescribed by your doctor","Eat fruit and vegetables","Walk or stretch gently for 20–30 minutes","Rest with feet up for a while","Count baby's movements (after week 28)"];
function renderChecklist() {
  const today = new Date().toDateString();
  if (!data.checks || data.checks.day !== today) data.checks = { day: today, done: [] };
  $("checklist").innerHTML = "";
  TASKS.forEach((t, i) => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = data.checks.done.includes(i);
    cb.addEventListener("change", () => {
      data.checks.done = cb.checked ? [...data.checks.done, i] : data.checks.done.filter((x) => x !== i);
      save(data);
    });
    li.append(cb, t); $("checklist").append(li);
  });
}

/* ---- reminders ---- */
function renderReminders() {
  const list = (data.reminders || []).sort((a, b) => a.time.localeCompare(b.time));
  $("remList").innerHTML = list.length ? "" : "<li>No reminders yet. Add your next appointment above.</li>";
  list.forEach((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span><strong></strong><br><small></small></span><button aria-label="Delete">Delete</button>`;
    li.querySelector("strong").textContent = r.text;
    li.querySelector("small").textContent = new Date(r.time).toLocaleString();
    li.querySelector("button").onclick = () => { data.reminders.splice(i, 1); save(data); renderReminders(); };
    $("remList").append(li);
  });
}
$("remForm").addEventListener("submit", (e) => {
  e.preventDefault();
  (data.reminders = data.reminders || []).push({ text: $("remText").value.trim(), time: $("remTime").value, fired: false });
  save(data); e.target.reset(); renderReminders();
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
});
setInterval(() => {   // fires while the app is open
  (data.reminders || []).forEach((r) => {
    if (!r.fired && new Date(r.time) <= new Date()) {
      r.fired = true; save(data);
      alert("Reminder: " + r.text);
      if ("Notification" in window && Notification.permission === "granted") new Notification("PregnaCare", { body: r.text });
    }
  });
}, 30000);

/* ---- tabs ---- */
document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.id === b.dataset.tab));
  if (b.dataset.tab !== "fun") stopBreathing();
}));

/* ================== AFTER BABY CARE ================== */
const MUM_TOPICS = [
  ["Rest and recovery", "Sleep when your baby sleeps, accept help from family, and do not rush back to housework. Gentle walking helps your circulation and recovery."],
  ["After a vaginal birth", "Soreness and swelling are common. Keep the area clean and dry, change pads often, wash your hands before and after using the toilet, and drink plenty of water. Eat fibre-rich foods to avoid constipation. Ask your midwife about stitches and pain relief that is safe for you."],
  ["After a caesarean birth", "Keep the wound clean and dry. Hold a pillow against your tummy when coughing or laughing, avoid lifting anything heavier than your baby, and follow the hospital's advice on movement, driving and wound dressings. Walk a little each day."],
  ["Bleeding after birth", "Some bleeding for several weeks is normal. It should slowly get lighter and change from red to pink to yellowish. Use pads, not tampons."],
  ["Breastfeeding and breast care", "Feed your baby whenever they show hunger signs. A good latch should not be painful, so ask the nurse or lactation counsellor to check. Wash nipples with plain water and let them air dry. Hot compresses and gentle massage can ease hard, full breasts."],
  ["Food and drink", "Eat regular meals with protein, vegetables, fruit and whole grains. Drink water often, especially when breastfeeding. Keep taking any supplements your doctor prescribed."],
  ["Your feelings", "Feeling tearful or anxious in the first two weeks is common (the baby blues). If sadness, worry or not coping lasts longer, or you feel unable to care for yourself or your baby, talk to your doctor or midwife. Support is available and you are not alone."],
  ["Your postnatal check-up", "Attend your postnatal visit as arranged by the hospital (usually around 6 weeks). Ask about family planning, exercise, your mood and any worries. Add the date under Reminders."],
];
const MUM_WARN = [
  "Soaking a pad in an hour, or passing large clots",
  "Fever, chills or foul-smelling discharge",
  "Severe headache, blurred vision or upper belly pain",
  "Chest pain, fast heartbeat or trouble breathing",
  "A painful, swollen or red area on one leg",
  "Wound that is red, swollen, leaking pus or opening",
  "Painful, red, hot breast with fever",
  "Feeling hopeless, or thoughts of harming yourself or your baby",
];
const BABY_TOPICS = [
  ["Feeding", "Newborns usually feed 8–12 times in 24 hours. Breast milk alone is recommended for about the first 6 months unless your doctor advises otherwise. Feed on demand and watch for hunger signs like rooting and sucking on hands."],
  ["Safe sleep", "Always place your baby on their back, on a firm flat mattress in their own cot. Keep pillows, toys and loose blankets out. Do not let anyone smoke near the baby. Keep the room comfortably cool."],
  ["Cord care", "Keep the cord stump clean and dry, and fold the nappy below it. Do not put anything on it unless the hospital advises. It usually falls off within 1 to 3 weeks."],
  ["Bathing and skin", "Give sponge baths until the cord falls off, in a warm room, and dry the skin folds well. Skin-to-skin contact keeps the baby warm and helps bonding and feeding."],
  ["Nappies and poo", "By day 5 to 6 your baby should have about 6 or more wet nappies a day. Change nappies often and clean gently with water. Use the log above to keep track."],
  ["Yellow skin (jaundice)", "Mild yellow skin is common in the first week. If the yellow colour spreads, deepens, or your baby is sleepy and feeding poorly, tell the doctor the same day."],
  ["Crying and comfort", "Babies cry to say they are hungry, tired, wet or want closeness. Try feeding, a nappy change, holding, swaddling and soft sounds. If you feel overwhelmed, put your baby safely in the cot and take a short break. Never shake a baby."],
  ["Vaccines and check-ups", "Follow the hospital's vaccination schedule and bring your baby's health card to every visit. Add the next date under Reminders."],
];
const BABY_WARN = [
  "Temperature of 38°C or higher, or feeling cold",
  "Not feeding, or refusing most feeds",
  "Very sleepy, floppy or hard to wake",
  "Fast, noisy or difficult breathing, or blue lips",
  "Yellow skin that is spreading, or very pale stools",
  "Fewer wet nappies than usual",
  "Green vomit, or repeated forceful vomiting",
  "Red, swollen or smelly cord, or any fit",
];
function fillTopics(id, topics) {
  $(id).innerHTML = "";
  topics.forEach(([title, text]) => {
    const d = document.createElement("details");
    const s = document.createElement("summary"); s.textContent = title;
    const p = document.createElement("p"); p.textContent = text;
    d.append(s, p); $(id).append(d);
  });
}
function fillList(id, items) {
  $(id).innerHTML = "";
  items.forEach((t) => { const li = document.createElement("li"); li.textContent = t; $(id).append(li); });
}
function renderBabyLog() {
  const today = new Date().toDateString();
  if (!data.babyLog || data.babyLog.day !== today) data.babyLog = { day: today, feeds: 0, wet: 0, dirty: 0 };
  $("feedN").textContent = data.babyLog.feeds;
  $("wetN").textContent = data.babyLog.wet;
  $("dirtyN").textContent = data.babyLog.dirty;
}
function renderAfter() {
  fillTopics("mumTopics", MUM_TOPICS); fillList("mumWarn", MUM_WARN);
  fillTopics("babyTopics", BABY_TOPICS); fillList("babyWarn", BABY_WARN);
  renderBabyLog();
}
document.querySelectorAll("[data-log]").forEach((b) => b.addEventListener("click", () => {
  const k = b.dataset.log;
  data.babyLog[k] = Math.max(0, data.babyLog[k] + Number(b.dataset.d));
  save(data); renderBabyLog();
}));
document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("on", x === b));
  document.querySelectorAll(".who").forEach((w) => w.classList.toggle("on", w.id === b.dataset.who));
}));

/* ================== RELAX & FUN ================== */

/* -- affirmations -- */
const AFFIRM = [
  "You are strong, and your body knows how to nurture your baby.",
  "Every day you are becoming the mother your baby needs.",
  "Rest is productive. You are doing important work.",
  "You are loved, and so is the little one you carry.",
  "Take it one day at a time. You are doing wonderfully.",
  "Your body is doing something amazing.",
  "It is okay to ask for help. You do not have to do it alone.",
  "Breathe in calm, breathe out worry.",
];
function newAffirmation() { $("affirm").textContent = AFFIRM[Math.floor(Math.random() * AFFIRM.length)]; }
$("affirmBtn").addEventListener("click", newAffirmation);

/* -- breathing guide (4s in, 4s out) -- */
let breathTimer = null;
function stopBreathing() {
  clearInterval(breathTimer); breathTimer = null;
  $("breathCircle").classList.remove("in");
  $("breathCircle").textContent = "Ready";
  $("breathBtn").textContent = "Start";
}
function breathStep(inhale) {
  $("breathCircle").classList.toggle("in", inhale);
  $("breathCircle").textContent = inhale ? "Breathe in" : "Breathe out";
}
$("breathBtn").addEventListener("click", () => {
  if (breathTimer) return stopBreathing();
  let inhale = true; breathStep(inhale);
  breathTimer = setInterval(() => { inhale = !inhale; breathStep(inhale); }, 4000);
  $("breathBtn").textContent = "Stop";
});

/* -- kick counter (resets daily) -- */
function renderKicks() {
  const today = new Date().toDateString();
  if (!data.kicks || data.kicks.day !== today) data.kicks = { day: today, n: 0 };
  $("kickNum").textContent = data.kicks.n;
}
$("kickBtn").addEventListener("click", () => { data.kicks.n++; save(data); renderKicks(); });
$("kickReset").addEventListener("click", () => { data.kicks.n = 0; save(data); renderKicks(); });

/* -- baby name ideas -- */
const NAMES = ["Aria","Noah","Luna","Liam","Zara","Ethan","Maya","Amara","Elijah","Sofia","Kai","Nora","Leo","Ivy","Omar","Aisha","Theo","Hana","Ben","Esme","Zane","Lila","Idris","Amina"];
let currentName = "";
function renderNames() {
  const list = data.names || [];
  $("nameList").innerHTML = "";
  list.forEach((n, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span></span><button aria-label="Remove">Remove</button>`;
    li.querySelector("span").textContent = "♥ " + n;
    li.querySelector("button").onclick = () => { data.names.splice(i, 1); save(data); renderNames(); };
    $("nameList").append(li);
  });
}
$("nameBtn").addEventListener("click", () => {
  currentName = NAMES[Math.floor(Math.random() * NAMES.length)];
  $("nameOut").textContent = currentName;
});
$("nameSave").addEventListener("click", () => {
  if (!currentName) return;
  data.names = data.names || [];
  if (!data.names.includes(currentName)) data.names.push(currentName);
  save(data); renderNames();
});

/* -- memory match game -- */
const FACES = ["👶","🍼","🧸","🌸","🎀","🦋","🌙","⭐"];
let first = null, lock = false, moves = 0, matched = 0;
function newGame() {
  const deck = [...FACES, ...FACES].sort(() => Math.random() - 0.5);
  first = null; lock = false; moves = 0; matched = 0;
  $("moves").textContent = 0; $("winMsg").textContent = "";
  $("board").innerHTML = "";
  deck.forEach((f) => {
    const b = document.createElement("button");
    b.className = "cell"; b.textContent = f; b.setAttribute("aria-label", "Card");
    b.addEventListener("click", () => flip(b));
    $("board").append(b);
  });
}
function flip(b) {
  if (lock || b.classList.contains("open") || b.classList.contains("done")) return;
  b.classList.add("open");
  if (!first) { first = b; return; }
  moves++; $("moves").textContent = moves;
  if (first.textContent === b.textContent) {
    first.classList.replace("open", "done"); b.classList.replace("open", "done");
    first = null; matched++;
    if (matched === FACES.length) $("winMsg").textContent = "🎉 Well done!";
  } else {
    lock = true;
    const a = first; first = null;
    setTimeout(() => { a.classList.remove("open"); b.classList.remove("open"); lock = false; }, 800);
  }
}
$("newGame").addEventListener("click", newGame);

/* ================================================= */

/* ---- patient details form ---- */
$("detailsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const lmp = $("lmp").value, c = calc(lmp);
  if (c.week < 0 || c.week > 42) { $("formError").textContent = "Check the date of your last period. It should be within the last 9 months."; return; }
  $("formError").textContent = "";
  data.patient = { name: $("name").value.trim(), age: $("age").value, pid: $("pid").value.trim(), phone: $("phone").value.trim(), lmp, cond: $("cond").value.trim() };
  if (!save(data)) $("formError").textContent = "Could not save on this device. Allow site storage and try again.";
  render();
});

/* ---- assistant (rule-based, works offline) ---- */
const URGENT = /bleed|leak|fluid|fit|seizure|faint|unconscious|can'?t breathe|chest pain|severe|no movement|not moving|less movement|blurred|water broke|blue lips|hard to wake|harm myself|harm my baby/i;
const KB = [
  [/breastfe|breast feed|latch|milk supply|nipple|nursing/, "Feed your baby whenever they show hunger signs, usually 8 to 12 times a day for a newborn. A good latch should not hurt, so ask the nurse or lactation counsellor to check it. Keep drinking water and eating regular meals."],
  [/cord|navel|belly button/, "Keep the cord stump clean and dry and fold the nappy below it. It usually falls off in 1 to 3 weeks. If it becomes red, swollen or smelly, take your baby to the hospital."],
  [/newborn|nappy|diaper|colic|crying|cry\b|baby sleep|jaundice|yellow/, "Newborns feed often, sleep a lot and cry to communicate. Always place your baby on their back to sleep in their own cot. Mild yellow skin is common in week one, but tell the doctor if it spreads or your baby is sleepy and not feeding. See the After baby tab for more."],
  [/c-?section|caesarean|cesarean|stitch|postpartum|postnatal|after birth|after delivery|lochia/, "After birth, rest, eat well, drink water and keep any wound clean and dry. Some bleeding for several weeks is normal and should get lighter. Attend your postnatal check-up. See the After baby tab for warning signs."],
  [/eat|food|diet|nutrition|meal|hungry/, "Eat a varied diet: vegetables, fruit, whole grains, pulses, eggs, fish (well cooked) and dairy. Avoid raw or undercooked meat, eggs and fish, unpasteurised milk, and limit caffeine. Ask the hospital dietitian if you have diabetes or anaemia."],
  [/water|drink|fluid|hydrat/, "Aim for plenty of water through the day. Pale yellow urine is a good sign."],
  [/exercise|walk|yoga|gym|workout/, "Gentle activity such as walking, stretching and antenatal yoga is usually safe. Stop and tell your doctor if you feel pain, dizziness or breathlessness."],
  [/nausea|vomit|morning sickness/, "Try small frequent meals, dry crackers before getting up, and ginger. If you cannot keep fluids down for a day, contact the hospital."],
  [/sleep|insomnia|tired|fatigue/, "Sleep on your left or right side, use a pillow between your knees, and rest during the day. Tiredness is common, especially in the first and third trimesters."],
  [/back pain|backache|leg|cramp|swell/, "Mild back pain and leg cramps are common: gentle stretching, warm baths and good posture help. Sudden swelling of face or hands, or one painful swollen leg, needs urgent review."],
  [/medicine|medication|drug|tablet|pill|paracetamol/, "Do not start or stop any medicine without asking your doctor or pharmacist. Take only what the hospital has prescribed."],
  [/alcohol|smok|drug use|vape/, "Alcohol, smoking and recreational drugs can harm your baby. Ask the hospital for confidential support to stop."],
  [/scan|ultrasound|test|appointment|visit|checkup|vaccin/, "Attend every antenatal and baby check-up visit. Scans, blood tests and vaccines protect you and your baby. Add your next appointment under Reminders."],
  [/movement|kick/, "From about week 28, notice your baby's usual pattern of movement every day. If it reduces or stops, contact the hospital the same day."],
  [/labou?r|contraction|delivery|birth/, "Early signs of labour include regular, increasing contractions, a show, or your waters breaking. Call the hospital when contractions come regularly or if your waters break."],
  [/mood|anxious|anxiety|sad|depress|stress|worried|baby blues/, "Feeling worried or low is common and you are not alone. Talk to your midwife or doctor, they can connect you with support."],
];
function answer(q) {
  if (URGENT.test(q)) return `This may be urgent. Please call ${HOSPITAL.name} now on ${HOSPITAL.phone} or go to the nearest emergency department.`;
  const hit = KB.find(([re]) => re.test(q.toLowerCase()));
  return hit ? hit[1] : "I do not have a safe answer for that. Please ask your doctor or midwife, or call the hospital on " + HOSPITAL.phone + ".";
}
function addMsg(text, cls) {
  const d = document.createElement("div"); d.className = "msg " + cls; d.textContent = text;
  $("chat").append(d); $("chat").scrollTop = $("chat").scrollHeight;
}
$("askForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("askText").value.trim(); if (!q) return;
  addMsg(q, "me"); addMsg(answer(q), "bot"); e.target.reset();
});
addMsg("Hi, I can answer general questions about pregnancy and newborn care. For anything urgent, call the hospital.", "bot");

/* ---- reset ---- */
$("resetBtn").addEventListener("click", () => {
  if (confirm("Delete all saved details on this device?")) { data = {}; try { localStorage.removeItem(KEY); } catch {} show("welcome"); }
});

render();