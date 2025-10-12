const SUPABASE_URL = 'https://bjsxvflupvmnsgwhkzvd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3h2Zmx1cHZtbnNnd2hrenZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDE5OTUsImV4cCI6MjA3NTUxNzk5NX0.WMllpRL9aVHXPZWanc1dUEC8laftI04JEe8xPPyr_ng';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

const sections = ["hero", "acara", "galeri", "gift", "rsvp", "footer"];
const cover = document.getElementById("cover");
const openBtn = document.getElementById("open-invite");
const bgMusic = document.getElementById("bg-music");

// ==== COVER ====
const guestName = getParam("to");
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
    const unik_id = getParam("unik_id");
    if (!unik_id) return showAlert("Parameter ?unik_id= tidak ditemukan", "error");

    const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("unik_id", unik_id)
        .single();

    if (error || !data) {
        console.error(error);
        showAlert("Data undangan tidak ditemukan", "error");
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
    document.getElementById("couple-names").textContent = `${groomFirst} & ${brideFirst}` || "Agus & Siti";
    document.getElementById("couple-names2").textContent = `${groomFirst} & ${brideFirst}` || "Agus & Siti";
    document.getElementById("hero-bg").style.backgroundImage = `url(${data.foto_pasangan || 'https://cdn.pixabay.com/photo/2022/11/27/08/05/garland-7619074_1280.jpg'})`;

    // === Event Date ===
    const eventDate = new Date(data.tanggal_nikah + "T00:00:00");
    const eventDateStr = eventDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    document.getElementById("event-date").textContent = eventDateStr;
    document.getElementById("event-date2").textContent = eventDateStr;

    // === Countdown ===
    const countdown = document.getElementById("countdown");
    function updateCountdown() {
        const now = new Date();
        const diff = eventDate - now;
        if (diff <= 0) {
            countdown.textContent = "Hari Bahagia Telah Tiba 💍";
            return;
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        countdown.textContent = `${d} hari ${h} jam lagi`;
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // === Foto dan Info ===
    document.getElementById("groom-img").src = data.foto_pria || "https://cdn.pixabay.com/photo/2015/11/19/03/16/son-in-law-1050289_1280.jpg";
    document.getElementById("bride-img").src = data.foto_wanita || "https://cdn.pixabay.com/photo/2020/09/10/14/11/model-5560527_960_720.jpg";
    document.getElementById("groom-name").textContent = data.pria;
    document.getElementById("bride-name").textContent = data.wanita;
    document.getElementById("groom-info").textContent = data.pria_info || "";
    document.getElementById("bride-info").textContent = data.wanita_info || "";

    // === Jadwal dan Lokasi ===
    document.getElementById("akad-time").textContent = data.akad_nikah ? `Pukul ${data.akad_nikah}` : "-";
    document.getElementById("resepsi-time").textContent = data.resepsi ? `Pukul ${data.resepsi}` : "-";
    document.getElementById("event-location").textContent = data.nama_lokasi || "-";
    document.getElementById("maps-link").href = data.url_maps || "#";

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
        });
    }

    // === Kisah Cinta & Catatan ===
    if (data.kisah_cinta) {
        const kisahSection = document.createElement("section");
        kisahSection.className = "py-16 text-center px-6 bg-white bg-center";
        kisahSection.style.backgroundImage = "url('./assets/bg1.jpg')";
        kisahSection.innerHTML = `
      <h2 class="text-5xl font-bold mb-6">Our Love Story</h2>
      <div class="section-ornament"></div>
      <p class="max-w-xl mx-auto text-slate-700">${data.kisah_cinta}</p>
    `;
        document.body.insertBefore(kisahSection, document.getElementById("gift"));
    }

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

            if (transferList.length > 0) {
                transferList.forEach(info => {
                    const div = document.createElement("div");
                    div.className = "p-4 border rounded-xl shadow bg-white mb-3";
                    div.innerHTML = `
            <p class="font-bold text-2xl mb-2">${info.Via}</p>
            <div class="title-ornament"></div>
            <p class="text-slate-700 text-2xl">${info.Number}</p>
            <p class="text-slate-700 text-lg font-bold">${info.Name}</p>
            <button onclick="copyText('${info.Number}')" class="btn-bounce bg-amber-500 mt-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                    Salin
            </button>
          `;
                    giftContainer.appendChild(div);
                });
            } else {
                giftContainer.innerHTML = `<p class='text-slate-500 italic text-center'>Belum ada informasi transfer.</p>`;
            }
        }
    } catch (e) {
        console.error("Gift error:", e);
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
        <button class="mt-2 text-amber-600 text-sm underline reply-btn" data-id="${r.id}">Balas</button>

        <div class="ml-4 mt-3 space-y-2">
          ${childReplies.map(rep => `
            <div class="border-l-2 border-amber-400 pl-3">
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
    <button class="mt-2 px-3 py-1 bg-amber-400 text-black text-sm rounded hover:bg-amber-500">Kirim</button>
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
    const shapes = ["circle", "square"];

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
        piece.style.animation = `fallConfetti ${Math.random() * 3 + 4}s linear infinite`;
        confetti.appendChild(piece);
    }

    setTimeout(() => (confetti.innerHTML = ""), 7000);
}

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
    navigator.clipboard.writeText(txt);
    showAlert("Tersalin: " + txt, "info");
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

zoomEls.forEach(el => zoomObserver.observe(el));