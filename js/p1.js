const SUPABASE_URL = 'https://bjsxvflupvmnsgwhkzvd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3h2Zmx1cHZtbnNnd2hrenZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5OTUsImV4cCI6MjA3NTUxNzk5NX0.WMllpRL9aVHXPZWanc1dUEC8laftI04JEe8xPPyr_ng';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const sections = ["hero", "acara", "galeri", "gift", "rsvp", "footer"];
const cover = document.getElementById("cover");
const openBtn = document.getElementById("open-invite");
const unik_id = getParam("unik_id");
const guestName = getParam("to");
let isPlaying = false;
const currentTemplate = "p1";

// ==== COVER ====

document.getElementById("cover-guest").textContent = guestName || "Tamu Undangan";
const guestLabel = document.getElementById("rsvp-guest-label");
guestLabel.textContent = guestName ? `${guestName}` : "Tamu Undangan";

openBtn.addEventListener("click", () => {
  cover.classList.add("hidden");
  bgMusic.play().catch(() => console.warn("Autoplay blocked"));
  sections.forEach(id => document.getElementById(id).classList.remove("hidden"));
  document.getElementById("bottom-nav").classList.remove("hidden");
  launchConfetti();
  //startFloral();
});

// ==== LOAD DATA UNDANGAN ====
async function loadInvitation() {
  if (!unik_id) {
    showAlert("Parameter UNIK_ID tidak ditemukan", "error");
    const res = await fetch("/assets/data.json");
    const defaultData = await res.json();
    renderInvitation(defaultData);
    return;
  }

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("unik_id", unik_id)
    .single();

  if (error || !data) {
    console.error(error);
    showAlert("Data undangan tidak ditemukan", "error");
    const defaultData = await res.json();
    renderInvitation(defaultData);
    return;
  }

  // === Validasi template ===
  if (data.template_sel && data.template_sel.trim() !== currentTemplate) {
    console.warn(`Template tidak cocok (${data.template_sel}), memuat data default.`);
    showAlert("Template tidak sesuai data, memuat data default.", "error");
    const res = await fetch("/assets/data.json");
    const defaultData = await res.json();
    renderInvitation(defaultData);
    return;
  }
  renderInvitation(data);

  // Pastikan rsvp-list langsung tampil meski belum ada ucapan
  loadRSVPs(data.id, data.unik_id);
}

function renderInvitation(data) {
  // === Nama depan saja ===
  const groomFirst = firstName(data.pria);
  const brideFirst = firstName(data.wanita);

  // === Hero ===
  document.getElementById("cover-couple").textContent = `${groomFirst} & ${brideFirst}` || "Agus & Siti";
  //document.getElementById("couple-names").textContent = `${groomFirst} & ${brideFirst}` || "Agus & Siti";
  document.getElementById("couple-names").innerHTML =
    `
      <h1 id="stack-main" class="stack-top">${groomFirst}</h1>
      <h1 class="stack-bottom">${brideFirst}</h1>
      <h1 class="stack-center"><i class="fa-regular fa-heart fa-rotate-by" style="color: #ff0000; --fa-rotate-angle: -15deg;"></i></h1>`
    ||
    ` <h1 id="stack-main" class="stack-top">Agus</h1>
      <h1 class="stack-bottom">Siti</h1>
      <h1 class="stack-center"><i class="fa-regular fa-heart fa-rotate-by" style="color: #ff0000; --fa-rotate-angle: -15deg;"></i></h1>`
  document.getElementById("couple-names2").textContent = `${groomFirst} & ${brideFirst}` || "Agus & Siti";
  document.getElementById("hero-bg").style.backgroundImage = `url(${data.foto_pasangan || 'https://cdn.pixabay.com/photo/2022/11/27/08/05/garland-7619074_1280.jpg'})`;
  // === Cover background & music custom ===
  const coverSection = document.getElementById("cover");
  const bgMusic = document.getElementById("bg-music");

  // Jika ada cover_url, ganti background cover
  if (data.cover_url && data.cover_url.trim() !== "") {
    coverSection.style.backgroundImage = `url(${data.cover_url})`;
  }

  // Jika ada custom_audio, ganti musik background
  if (data.custom_audio && data.custom_audio.trim() !== "") {
    const source = bgMusic.querySelector("source");
    source.src = data.custom_audio;
    bgMusic.load();
  }

  const weddingFrame = document.getElementById("wedding-frame");
  if (weddingFrame) {
    if (data.cover_url && data.cover_url.trim() !== "") {
      weddingFrame.style.display = "block";
    } else {
      weddingFrame.style.display = "none";
    }
  }
  if (weddingFrame && !data.cover_url) {
    weddingFrame.style.display = "block";
  }
  // === Event Date ===
  const eventDate = new Date(data.tanggal_nikah + "T00:00:00");
  const eventDateStr = eventDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  document.getElementById("event-date").textContent = eventDateStr;
  document.getElementById("event-date2").textContent = eventDateStr;

  // Countdown Time
  let tanggal = data.tanggal_nikah;
  let waktu = data.akad_nikah || data.resepsi || "08:00:00";
  const targetDate = new Date(`${tanggal}T${waktu}`);

  startCountdown(targetDate);
  startCountdown2(targetDate);

  // === Foto dan Info ===
  document.getElementById("groom-img").src = data.foto_pria || "https://cdn.pixabay.com/photo/2015/11/19/03/16/son-in-law-1050289_1280.jpg";
  document.getElementById("bride-img").src = data.foto_wanita || "https://cdn.pixabay.com/photo/2020/09/10/14/11/model-5560527_960_720.jpg";
  document.getElementById("groom-name").textContent = data.pria || "Agus";
  document.getElementById("bride-name").textContent = data.wanita || "Siti";
  document.getElementById("groom-info").textContent = data.pria_info || "Mempelai Pria";
  document.getElementById("bride-info").textContent = data.wanita_info || "Mempelai Wanita";

  // === Jadwal dan Lokasi ===
  document.getElementById("akad-time").textContent = data.akad_nikah ? `Pukul ${data.akad_nikah}` : "Sudah Terlaksana";
  document.getElementById("resepsi-time").textContent = data.resepsi ? `Pukul ${data.resepsi}` : "-";
  document.getElementById("event-location").textContent = data.nama_lokasi || "-";
  document.getElementById("maps-link").href = data.url_maps || "#";
  const mapsLink = document.getElementById("maps-link");
  if (mapsLink && data.url_maps) {
    mapsLink.addEventListener("click", () => {
      if (typeof umami !== "undefined") {
        umami.track("Open Google Maps", {
          unik_id: data.unik_id || "default",
          to: getParam("to") || "Unknown",
          location: data.nama_lokasi || "Unknown"
        });
      }
    });
  }
  // === Galeri ===
  try {
    const galContainer = document.getElementById("gallery-container");
    if (galContainer) {
      galContainer.innerHTML = "";
      let galeriArr = [];
      if (Array.isArray(data.galeri)) galeriArr = data.galeri;
      else if (typeof data.galeri === "string") galeriArr = JSON.parse(data.galeri);

      if (galeriArr.length > 0) {
        galeriArr.forEach((url, i) => {
          const img = document.createElement("img");
          img.src = url;
          img.alt = `Foto ${i + 1}`;
          img.loading = "lazy";
          img.className = "rounded-xl shadow-lg w-full h-86 object-cover transition-transform duration-300 hover:scale-105 fade-in";
          galContainer.appendChild(img);
        });
        requestAnimationFrame(() => {
          galContainer.querySelectorAll(".fade-in").forEach(el => el.classList.add("show"));
        });
      } else {
        galContainer.innerHTML = `<p class="text-slate-500 italic">Belum ada foto galeri.</p>`;
      }
    }
  } catch (err) {
    console.error("Error galeri:", err);
  }

  // === Add to Google Calendar ===
  const addBtn = document.getElementById("add-calendar-btn");
  if (addBtn) {
    const startDate = new Date(data.tanggal_nikah + "T" + (data.resepsi || "08:00:00"));
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 jam
    const formatDate = (d) =>
      d.toISOString().replace(/[-:]|\.\d{3}/g, "");

    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", `Pernikahan ${data.pria} & ${data.wanita}`);
    url.searchParams.set("dates", `${formatDate(startDate)}/${formatDate(endDate)}`);
    url.searchParams.set("details", data.kisah_cinta || "Undangan Pernikahan");
    url.searchParams.set("location", data.nama_lokasi || "");
    url.searchParams.set("sf", "true");
    url.searchParams.set("output", "xml");

    addBtn.addEventListener("click", () => {
      window.open(url.toString(), "_blank");

      if (typeof umami !== "undefined") {
        umami.track("Add to Google Calendar", {
          unik_id: data.unik_id || "default",
          to: getParam("to") || "Unknown"
        });
      }
    });
  }

  // === Kisah Cinta & Catatan ===
  // if (data.kisah_cinta) {
  //   const kisahSection = document.createElement("section");
  //   kisahSection.className = "py-16 text-center px-6 bg-slate-200 bg-center";
  //   kisahSection.innerHTML = `
  //     <div class="stacked-title mb-8">
  //     <h1 id="stack-main" class="stack-large">Our Love</h1>
  //     <h2 id="stack-sub" class="stack-small opacity-90">Story</h2>
  //   </div>
  //     <p class="max-w-xl mx-auto text-slate-700">${data.kisah_cinta}</p>
  //   `;
  //   document.body.insertBefore(kisahSection, document.getElementById("gift"));
  // }

  if (data.catatan) {
    const note = document.createElement("p");
    note.className = "mt-8 text-center text-slate-600 italic";
    note.textContent = data.catatan;
    document.getElementById("rsvp").prepend(note);
  }

  // --- Gift ---
  try {
    const giftContainer = document.querySelector("#gift .max-w-md");
    if (giftContainer) {
      giftContainer.innerHTML = "";
      let transferList = [];

      if (Array.isArray(data.transfer_info)) transferList = data.transfer_info;
      else if (typeof data.transfer_info === "string" && data.transfer_info.trim() !== "")
        transferList = JSON.parse(data.transfer_info);

      // Fungsi menentukan logo sesuai nama bank / e-wallet
      function getBankLogo(via) {
        const v = via.toLowerCase();
        if (v.includes("bca"))
          return "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg";
        if (v.includes("bni"))
          return "https://upload.wikimedia.org/wikipedia/commons/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg";
        if (v.includes("bri"))
          return "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg";
        if (v.includes("mandiri"))
          return "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg";
        if (v.includes("dana"))
          return "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg";
        if (v.includes("ovo"))
          return "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg";
        if (v.includes("gopay"))
          return "https://upload.wikimedia.org/wikipedia/commons/0/00/Logo_Gopay.svg";
        if (v.includes("shopee"))
          return "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg";
        return "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"; // default gift icon
      }
      //             <div class="gift-bank">${info.Via}</div>
      if (transferList.length > 0) {
        transferList.forEach(info => {
          if (info.Via && info.Via.toLowerCase().includes("kirim hadiah")) {
            const div = document.createElement("div");
            div.className = "gift-card";
            div.innerHTML = `
             <i class="fa-solid fa-gift gift-icon"></i>
              <h4 class="gift-send-title mb-4">${info.Via}</h4>
              <div class="title-ornament bg-slate-200"></div>
            <p class="gift-send-name"><strong>${info.Name}</strong></p>
            <p class="gift-send-address">${info.Number}<br>${info.Address || "-"}</p>
            <button onclick="copyText('${info.Address}')" class="gift-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy Address
          </button>
          `;
            giftContainer.appendChild(div);
          } else {

            const div = document.createElement("div");
            const logo = getBankLogo(info.Via);
            div.className = "gift-card";
            div.innerHTML = `
          <div class="gift-header"> 
            <img src="${logo}" alt="${info.Via}" class="gift-logo">
          </div>
          <div class="gift-content"> 
            <div class="gift-chip">
            <img src="./assets/chip-atm.png" alt="Chip">
            </div>

            <div class="gift-number">${info.Number}</div>
            <div class="gift-name">${info.Name}</div>
          </div>
          <button onclick="copyText('${info.Number}')" class="gift-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy
          </button>
        `;
            giftContainer.appendChild(div);
          }
        });
      } else {
        giftContainer.innerHTML = `<p class='text-slate-500 italic text-center'>Belum ada informasi transfer.</p>`;
      }
    }
  } catch (e) {
    console.error("Gift error:", e);
  }
  try {
    if (typeof umami !== "undefined") {
      const params = {
        unik_id: data.unik_id || unik_id || "default",
        to: guestName || "Unknown",
        template: data.template_sel || currentTemplate || "no template"
      };
      umami.track("Invitation Opened", params);
    }
  } catch (err) {
    console.warn("Umami tracking failed:", err);
  }
  loadRSVPs(data.id, data.unik_id);

}

// ==== RSVP ====
async function loadRSVPs(invId, unikId) {
  const { data, error } = await supabase
    .from("rsvp")
    .select("*")
    .or(`invitation_id.eq.${invId},unik_id.eq.${unikId}`)
    .order("created_at", { ascending: false });

  const list = document.getElementById("rsvp-list");

  if (error) {
    console.error(error);
    list.innerHTML = "<p class='text-red-500 text-center'>Gagal memuat ucapan.</p>";
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = "<p class='text-slate-500 text-center'>Belum ada ucapan 💌</p>";
    return;
  }

  // Pisahkan komentar & balasan
  const mainComments = data.filter(c => !c.parent_id);
  const replies = data.filter(c => c.parent_id);

  list.innerHTML = mainComments.map(r => {
    const childReplies = replies.filter(rep => rep.parent_id === r.id);
    return `
      <div class="p-4 bg-white rounded-lg shadow fade-in mb-3">
        <div class="font-bold">${r.guest_name}</div>
        <div class="text-sm text-slate-500">${r.attendance} • ${timeAgo(r.created_at)}</div>
        <p class="mt-2 text-slate-700">${r.message || ""}</p>
        <button class="mt-2 text-primary text-sm reply-btn font-bold" data-id="${r.id}">Balas</button>

        <div class="ml-4 mt-3 space-y-2">
          ${childReplies.map(rep => `
            <div class="border-l-2 border-primary pl-3">
              <div class="text-sm text-slate-700">
                <strong>${rep.guest_name}</strong>
                <span class="text-slate-400 text-xs">• ${timeAgo(rep.created_at)}</span>
              </div>
              <div class="text-slate-600 text-sm">${rep.message}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

  // aktifkan tombol Balas
  document.querySelectorAll(".reply-btn").forEach(btn => {
    btn.addEventListener("click", () => showReplyForm(btn.dataset.id));
  });
  setTimeout(() => {
    list.querySelectorAll(".fade-in").forEach(el => el.classList.add("show"));
  }, 100);

}
function firstName(fullName) {
  if (!fullName) return "";
  return fullName.trim().split(" ")[0];
}
// === Format waktu relatif ===
function timeAgo(isoDate) {
  const diff = (new Date() - new Date(isoDate)) / 1000; // detik
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;
  return new Date(isoDate).toLocaleDateString("id-ID");
}

// === Menampilkan form balasan ===
function showReplyForm(parentId) {
  // hilangkan form lain dulu
  const existing = document.getElementById("reply-form");
  if (existing) existing.remove();

  const form = document.createElement("div");
  form.id = "reply-form";
  form.className = "mt-3";
  form.innerHTML = `
    <textarea id="reply-message" class="w-full border rounded px-3 py-2 text-sm" rows="2" placeholder="Tulis balasan..."></textarea>
    <button class="mt-2 px-3 py-1 bg-primary text-black text-sm rounded hover:bg-primary">Kirim</button>
  `;
  const parentCard = document.querySelector(`[data-id="${parentId}"]`).closest(".p-4");
  parentCard.appendChild(form);

  form.querySelector("button").addEventListener("click", async () => {
    const msg = document.getElementById("reply-message").value.trim();
    if (!msg) return showAlert("Tuliskan pesan balasan.", "info");
    await submitReply(parentId, msg);
    form.remove();
  });
}
function parseGallery(galeri) {
  if (!galeri) return [];
  try {
    if (typeof galeri === "string") {
      // Normalisasi kutip ganda ganda -> tunggal
      const clean = galeri.replace(/""/g, '"');
      return JSON.parse(clean);
    }
    return galeri;
  } catch (e) {
    console.error("Gagal parse galeri:", e);
    return [];
  }
}
// === Countdown Logic ===
function startCountdown(targetDate) {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      clearInterval(timer);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    daysEl.textContent = days.toString().padStart(2, "0");
    hoursEl.textContent = hours.toString().padStart(2, "0");
    minutesEl.textContent = minutes.toString().padStart(2, "0");
    secondsEl.textContent = seconds.toString().padStart(2, "0");
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}
function startCountdown2(targetDate) {
  const daysEl = document.getElementById("days2");
  const hoursEl = document.getElementById("hours2");
  const minutesEl = document.getElementById("minutes2");
  const secondsEl = document.getElementById("seconds2");

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      clearInterval(timer);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    daysEl.textContent = days.toString().padStart(2, "0");
    hoursEl.textContent = hours.toString().padStart(2, "0");
    minutesEl.textContent = minutes.toString().padStart(2, "0");
    secondsEl.textContent = seconds.toString().padStart(2, "0");
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}

// === MUSIC CONTROL ===
const bgMusic = document.getElementById("bg-music");
const musicToggle = document.getElementById("music-toggle");
const musicIcon = document.getElementById("music-icon");

let wasPlayingBeforeHide = false;

if (musicToggle) musicToggle.classList.add("hidden");

if (openBtn && bgMusic) {
  openBtn.addEventListener("click", async () => {
    try {
      // Mainkan musik
      await bgMusic.play();
      // Tampilkan tombol musik dengan animasi halus
      musicToggle.classList.remove("hidden");
      musicToggle.classList.add("animate-bounce-in");
    } catch (err) {
      console.warn("Autoplay blocked, user gesture required:", err);
    }
  });
}

// --- Tombol manual toggle musik ---
if (musicToggle && bgMusic) {
  musicToggle.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play().catch(() => { });
      musicIcon.classList.remove("fa-play");
      musicIcon.classList.add("fa-music", "fa-bounce");
    } else {
      bgMusic.pause();
      musicIcon.classList.remove("fa-music", "fa-bounce");
      musicIcon.classList.add("fa-play");
    }
  });

  // --- Event: Tab keluar fokus / aplikasi di-minimize ---
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (!bgMusic.paused) {
        wasPlayingBeforeHide = true;
        bgMusic.pause();
      }
    } else if (wasPlayingBeforeHide) {
      bgMusic.play().catch(() => { });
      wasPlayingBeforeHide = false;
    }
  });

  window.addEventListener("blur", () => {
    if (!bgMusic.paused) {
      wasPlayingBeforeHide = true;
      bgMusic.pause();
    }
  });
  window.addEventListener("focus", () => {
    if (wasPlayingBeforeHide) {
      bgMusic.play().catch(() => { });
      wasPlayingBeforeHide = false;
    }
  });
}
// === Kirim balasan ke Supabase ===
async function submitReply(parentId, message) {
  const name = guestName || "Tamu";
  const unik_id = getParam("unik_id");

  // cari id undangan dari unik_id
  const { data: invData, error: invErr } = await supabase
    .from("invitations")
    .select("id")
    .eq("unik_id", unik_id)
    .single();

  if (invErr || !invData) return showAlert("Gagal menemukan undangan.", "error");

  const { error } = await supabase.from("rsvp").insert({
    invitation_id: invData.id,
    unik_id,
    guest_name: name,
    attendance: "Balasan",
    message,
    parent_id: parentId,
  });

  if (error) {
    console.error(error);
    showAlert("Gagal mengirim balasan.", "error");
  } else {
    loadRSVPs(invData.id, unik_id);
  }
}

// ==== SUBMIT RSVP ====
document.getElementById("submit-rsvp").addEventListener("click", async () => {
  const attendance = document.getElementById("attendance-input").value;
  const message = document.getElementById("message-input").value.trim();
  const unik_id = getParam("unik_id");
  const name = guestName || "Tamu Undangan";

  if (!attendance) return showAlert("Silakan pilih kehadiran Anda.", "info");
  if (!message) return showAlert("Silakan tulis ucapan atau doa.", "info");

  const { data: invData, error: invError } = await supabase
    .from("invitations")
    .select("id")
    .eq("unik_id", unik_id)
    .single();

  if (invError || !invData) {
    console.error(invError);
    return showAlert("Gagal menemukan undangan.", "error");
  }

  const { error } = await supabase.from("rsvp").insert({
    invitation_id: invData.id,
    unik_id,
    guest_name: name,
    attendance,
    message,
  });

  if (error) {
    console.error(error);
    showAlert("❌ Gagal menyimpan ucapan: " + error.message, "error");
  } else {
    showAlert("Terima kasih atas ucapan anda", "success");
    document.getElementById("attendance-input").value = "";
    document.getElementById("message-input").value = "";
    loadRSVPs(invData.id, unik_id);
  }
});
// === KONFETI & FLORAL EFFECT ===
function launchConfetti() {
  const confetti = document.getElementById("confetti");
  if (!confetti) return;
  confetti.innerHTML = "";
  const colors = ["#fbbf24", "#fcd34d", "#f9a8d4", "#fde68a", "#fff"];
  const shapes = ["circle"];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    const size = Math.random() * 10 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    piece.style.position = "absolute";
    piece.style.top = "-10px";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.width = size + "px";
    piece.style.height = size + "px";
    piece.style.background = color;
    piece.style.borderRadius = shape === "circle" ? "50%" : "0";
    piece.style.opacity = "0.9";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.animation = `fallConfetti ${Math.random() * 3 + 4}s linear forwards`;
    confetti.appendChild(piece);
  }

  // Hapus dengan efek fade-out lembut
  setTimeout(() => {
    confetti.querySelectorAll("div").forEach(piece => {
      piece.style.transition = "opacity 1s ease";
      piece.style.opacity = "0";
    });
    setTimeout(() => (confetti.innerHTML = ""), 1000);
  }, 8000);
}

let confettiCooldown = false;

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  // Deteksi apakah pengguna di hero section (atas layar)
  if (scrollTop < 80 && !confettiCooldown) {
    launchConfetti();
    confettiCooldown = true;

    // Cooldown supaya tidak spam saat user scroll naik-turun cepat
    setTimeout(() => (confettiCooldown = false), 2000);
  }
});

const style = document.createElement("style");
style.textContent = `
@keyframes fallConfetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}`;
document.head.appendChild(style);

// === FLORAL PARTICLES ===
function startFloral() {
  const floral = document.getElementById("floral");
  if (!floral) return;
  const flowers = ["💙", "💗", "💚", "💜", "💛", "🖤"];
  for (let i = 0; i < 10; i++) {
    const f = document.createElement("div");
    f.classList.add("flower");
    f.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    f.style.left = Math.random() * 100 + "vw";
    f.style.fontSize = Math.random() * 16 + 14 + "px";
    f.style.animationDuration = Math.random() * 5 + 8 + "s";
    floral.appendChild(f);

    setTimeout(() => f.remove(), 10000);
  }
  setTimeout(startFloral, 1500); // loop pelan-pelan
}


// ==== TAB BAWAH ====
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    document.getElementById(target).scrollIntoView({ behavior: "smooth" });
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ==== COPY BUTTON ====
function copyText(txt) {
  const modifiedTxt = txt.replace(/[ \-+]/g, '');
  navigator.clipboard.writeText(modifiedTxt);
  showAlert(txt + " - Sudah tersalin", "info");
}

// INIT
loadInvitation();
// ==== ANIMASI SAAT SCROLL ====
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("show");
  });
});
document.querySelectorAll(".fade-in, .zoom-in, .slide-up").forEach(el => observer.observe(el));

// === DETEKSI SCROLL UNTUK ANIMASI ZOOM ===
const zoomEls = document.querySelectorAll(".scroll-zoom");
const zoomObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        zoomObserver.unobserve(entry.target); // hanya animasi sekali
      }
    });
  },
  { threshold: 0.2 }
);
document.addEventListener("DOMContentLoaded", function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      } else {
        entry.target.classList.remove("visible"); // agar animasi bisa diputar ulang
      }
    });
  }, { threshold: 0.3 }); // bisa disesuaikan

  document.querySelectorAll(".animate, .animate-zoom, .animate-slide, .animate-slide2").forEach(el => observer.observe(el));
});
// === LOADING SCREEN CONTROL ===
document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loading-screen");

  // Simulasi delay agar semua teks & animasi siap (2.5 detik)
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
  }, 2500); // bisa diubah ke 2000–3000 ms sesuai kebutuhan

  // Jika data Supabase selesai sebelum 2.5s, pastikan tetap menunggu
  window.addEventListener("invitationLoaded", () => {
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 800);
  });
});

zoomEls.forEach(el => zoomObserver.observe(el));
document.addEventListener("DOMContentLoaded", loadInvitation());