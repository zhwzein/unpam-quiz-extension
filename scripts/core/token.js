console.log("Token.js sedang dijalankan!");
// Inisialisasi UI dan logic token

(function () {
  let authToken = null;
  let isHandlingCourseApiRequest = false;
  let courseDataList = [];
  let userInfo = null;

  // Nama kunci untuk localStorage
  const STORAGE_KEYS = {
    AUTH_TOKEN: "mentari_auth_token",
    USER_INFO: "mentari_user_info",
    COURSE_DATA: "mentari_course_data",
    LAST_UPDATE: "mentari_last_update",
  };

  // Fungsi untuk menyimpan data ke localStorage
  function saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Data berhasil disimpan ke ${key}`);
    } catch (error) {
      console.error(`Error menyimpan data ke ${key}:`, error);
    }
  }

  // Fungsi untuk mengambil data dari localStorage
  function getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error mengambil data dari ${key}:`, error);
      return null;
    }
  }

  // Fungsi untuk menghapus cache data
  window.clearCacheData = function () {
    localStorage.removeItem(STORAGE_KEYS.COURSE_DATA);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
    console.log(
      "Cache data berhasil dihapus. Refresh halaman untuk mengambil data baru."
    );
  };

  // Fungsi untuk melakukan tracking ulang
  window.refreshAndTrack = function () {
    clearCacheData();
    authToken = null;
    userInfo = null;
    courseDataList = [];
    studentDataList = [];
    checkStorages();
    fetchCoursesListAndDetails(true);
  };

  // Buat popup UI
  function createPopupUI() {
    if (document.getElementById("token-runner-popup")) return;
    let fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    fa.crossOrigin = "anonymous";
    document.head.appendChild(fa);

    // Create main container
    const popup = document.createElement("div");
    popup.id = "token-runner-popup";
    popup.className = "collapsed";
    popup.innerHTML = `
    <div class="popup-toggle" id="popup-toggle">
      <img src="https://user-images.githubusercontent.com/74038190/212257472-08e52665-c503-4bd9-aa20-f5a4dae769b5.gif" alt="zenext" />
    </div>
    <div class="token-loading-bar"></div>
    <div class="popup-content">
      <div class="popup-header">
        <div class="popup-left"></div>
        <span class="popup-title">NEXT MENTARI</span>
        <div class="token-popup-actions">
          <button id="token-reset-btn" title="Reset Cache & Track Ulang"><i class="fa-solid fa-rotate-right fa-fw"></i></button>
        </div>
      </div>
      <div class="token-tabs">
        <button class="token-tab active" data-tab="forum-data">Forum</button>
        <button class="token-tab" data-tab="user-info">User Info</button>
        <button class="token-tab" data-tab="chat-ai">AI Chat</button>
      </div>


      <div class="token-tab-content" id="user-info-tab">
        <div class="token-info-section">
          <p>Klik Dashboard atau buka salah satu Course</p>
        </div>
      </div>


      <div class="token-tab-content" id="token-data-tab">
        <div class="token-info-section">
          <p>Menunggu token...</p>
        </div>
      </div>


      <div class="token-tab-content active" id="forum-data-tab">
        <div class="token-info-section">
          
        </div>
        <div id="forum-list"></div>
      </div>

    
      <div class="token-tab-content" id="chat-ai-tab">
        <div class="token-info-section">
          <p>Menunggu token...</p>
        </div>
      </div>
    </div>`;

    document.body.appendChild(popup);

    document.getElementById("popup-toggle").addEventListener("click", function () {
      // Toggle the popup visibility
      const popupContent = document.querySelector(".popup-content");
      popupContent.classList.toggle("active");

      // Hide the icon when the popup is active
      if (popupContent.classList.contains("active")) {
        document.getElementById("popup-toggle").classList.add("hide");
      } else {
        document.getElementById("popup-toggle").classList.remove("hide");
      }
    });


    function refreshAndTrackWithLoading() {
      const loadingBar = document.querySelector(".token-loading-bar");
      loadingBar.classList.add("active");
      if (typeof window.refreshAndTrack === "function") {
        const result = window.refreshAndTrack();

        if (result && typeof result.then === "function") {
          result
            .then(() => {
              setTimeout(() => loadingBar.classList.remove("active"), 500);
            })
            .catch(() => {
              setTimeout(() => loadingBar.classList.remove("active"), 500);
            });
        } else {
          // If not a promise, hide loading after a delay
          setTimeout(() => loadingBar.classList.remove("active"), 1500);
        }

        return result;
      } else {
        setTimeout(() => loadingBar.classList.remove("active"), 1500);
      }
    }

    function toggleCollapse() {
      popup.classList.toggle("collapsed");
    }

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    popup.querySelector(".popup-header").addEventListener("mousedown", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) {
        return;
      }

      isDragging = false;
      offsetX = e.clientX - popup.getBoundingClientRect().left;
      offsetY = e.clientY - popup.getBoundingClientRect().top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;

      if (
        x > 0 &&
        x < window.innerWidth - popup.offsetWidth &&
        y > 0 &&
        y < window.innerHeight - popup.offsetHeight
      ) {
        popup.style.left = x + "px";
        popup.style.top = y + "px";
        popup.style.right = "auto";
        popup.style.bottom = "auto";
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    const dragHandles = [
      popup.querySelector(".popup-header"),
      popup.querySelector(".popup-toggle"),
    ];

    dragHandles.forEach((handle) => {
      handle.addEventListener(
        "touchstart",
        (e) => {
          if (e.target.closest("button") || e.target.closest("a")) {
            return;
          }

          isDragging = true;
          offsetX = e.touches[0].clientX - popup.getBoundingClientRect().left;
          offsetY = e.touches[0].clientY - popup.getBoundingClientRect().top;
        },
        { passive: true }
      );
    });

    document.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;

        e.preventDefault();
        const x = e.touches[0].clientX - offsetX;
        const y = e.touches[0].clientY - offsetY;

        if (
          x > 0 &&
          x < window.innerWidth - popup.offsetWidth &&
          y > 0 &&
          y < window.innerHeight - popup.offsetHeight
        ) {
          popup.style.left = x + "px";
          popup.style.top = y + "px";
          popup.style.right = "auto";
          popup.style.bottom = "auto";
        }
      },
      { passive: false }
    );

    document.addEventListener("touchend", () => {
      isDragging = false;
    });

    const toggle = popup.querySelector(".popup-toggle");

    toggle.addEventListener(
      "touchstart",
      (e) => {
        if (popup.classList.contains("collapsed")) {
          isDragging = true;
          offsetX = e.touches[0].clientX - popup.getBoundingClientRect().left;
          offsetY = e.touches[0].clientY - popup.getBoundingClientRect().top;
        }
      },
      { passive: true }
    );

    toggle.addEventListener("click", (e) => {
      if (!isDragging || popup.classList.contains("collapsed")) {
        toggleCollapse();
      }
      isDragging = false;
    });

    document
      .getElementById("token-reset-btn")
      .addEventListener("click", refreshAndTrackWithLoading);

    document.querySelectorAll(".token-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document
          .querySelectorAll(".token-tab")
          .forEach((t) => t.classList.remove("active"));
        document
          .querySelectorAll(".token-tab-content")
          .forEach((c) => c.classList.remove("active"));

        tab.classList.add("active");
        const tabId = tab.dataset.tab + "-tab";
        document.getElementById(tabId).classList.add("active");
      });
    });

    applyDefaultPosition();

    function applyDefaultPosition() {
      const positions = [
        {
          bottom: "20px",
          right: "20px",
          top: "auto",
          left: "auto",
          isRight: true,
        }, // Bottom Right
        {
          bottom: "20px",
          right: "auto",
          top: "auto",
          left: "20px",
          isRight: false,
        }, // Bottom Left
        {
          bottom: "auto",
          right: "auto",
          top: "20px",
          left: "20px",
          isRight: false,
        }, // Top Left
        {
          bottom: "auto",
          right: "20px",
          top: "20px",
          left: "auto",
          isRight: true,
        }, // Top Right
      ];

      let currentPosition = parseInt(
        localStorage.getItem("tokenRunnerPosition") || "0"
      );

      const pos = positions[currentPosition];

      popup.style.bottom = pos.bottom;
      popup.style.right = pos.right;
      popup.style.top = pos.top;
      popup.style.left = pos.left;
    }
  }

  function addPositionToggleToPopup() {
    const popup = document.getElementById("token-runner-popup");
    if (!popup) return;

    const positionBtn = document.createElement("button");
    positionBtn.id = "token-position-btn";
    positionBtn.style.display = "none";
    positionBtn.innerHTML = '<i class="fa-solid fa-arrows-up-down-left-right fa-fw"></i>';

    const actionsDiv = document.querySelector(".token-popup-actions");
    if (actionsDiv) {
      actionsDiv.insertBefore(positionBtn, actionsDiv.firstChild);
    }

    const positions = [
      {
        bottom: "20px",
        right: "20px",
        top: "auto",
        left: "auto",
        isRight: true,
      }, // Bottom Right
      {
        bottom: "20px",
        right: "auto",
        top: "auto",
        left: "20px",
        isRight: false,
      }, // Bottom Left
      {
        bottom: "auto",
        right: "auto",
        top: "20px",
        left: "20px",
        isRight: false,
      }, // Top Left
      {
        bottom: "auto",
        right: "20px",
        top: "20px",
        left: "auto",
        isRight: true,
      }, // Top Right
    ];

    let currentPosition = parseInt(
      localStorage.getItem("tokenRunnerPosition") || "0"
    );

    applyPosition(currentPosition);

    function applyPosition(posIndex) {
      const pos = positions[posIndex];

      popup.style.bottom = pos.bottom;
      popup.style.right = pos.right;
      popup.style.top = pos.top;
      popup.style.left = pos.left;
    }
  }

  const originalCreatePopupUI = createPopupUI;
  createPopupUI = function () {
    originalCreatePopupUI();
    addPositionToggleToPopup();
  };

  if (document.getElementById("token-runner-popup")) {
    addPositionToggleToPopup();
  }

  function toggleCollapse() {
    const popup = document.getElementById("token-runner-popup");
    if (popup) {
      if (popup.classList.contains("collapsed")) {
        popup.style.width = "";
      } else {
        popup.style.width = "300px";
      }
      popup.classList.toggle("collapsed");
    }
  }

  function decodeToken(token) {
    try {
      if (!token) return null;
      if (token.startsWith("Bearer ")) token = token.substring(7);

      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));

      return {
        token,
        payload,
        userId: payload.id || payload.username || payload.sub || "unknown",
        username: payload.username || payload.name || payload.sub || "unknown",
        fullname: payload.fullname || payload.name || payload.username || "unknown",
        role: payload.role || payload.roles || "unknown",
        expires: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : "unknown",
      };
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  }

  function extractCourseCodeFromUrl(url) {
    const courseCodeRegex = /\/api\/user-course\/([0-9]{5}-[0-9A-Z]+(?:-[0-9A-Z]+)?)/;
    const match = url.match(courseCodeRegex);
    if (match && match[1]) return match[1];

    const pageUrlRegex = /\/u-courses\/([0-9]{5}-[0-9A-Z]+(?:-[0-9A-Z]+)?)/;
    const pageMatch = url.match(pageUrlRegex);
    if (pageMatch && pageMatch[1]) return pageMatch[1];

    return null;
  }

  function createCustomUrl(courseCode) {
    return courseCode
      ? `https://mentari.unpam.ac.id/u-courses/${courseCode}`
      : null;
  }

  function updateTokenUI(token, tokenInfo) {
    const tokenTab = document.getElementById("token-data-tab");
    if (!tokenTab) return;

    let tokenDisplay = token;
    if (tokenDisplay && tokenDisplay.length > 40) {
      tokenDisplay =
        tokenDisplay.substring(0, 15) +
        "..." +
        tokenDisplay.substring(tokenDisplay.length - 15);
    }

    tokenTab.innerHTML = `
      <div class="token-info-section">
        <h4>Bearer Token</h4>
        <p><span class="token-value">${tokenDisplay || "Tidak ditemukan"}</span>
          <button class="token-copy-btn" data-copy="${token}">Copy</button>
        </p>
      </div>
      <div class="token-info-section">
        <h4>Payload</h4>
        <pre>${JSON.stringify(tokenInfo?.payload || {}, null, 2)}</pre>
      </div>
    `;

    tokenTab.querySelectorAll(".token-copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const textToCopy = btn.getAttribute("data-copy");
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.innerText;
          btn.innerText = "Copied!";
          setTimeout(() => {
            btn.innerText = originalText;
          }, 1500);
        });
      });
    });
  }

  function updateUserInfoUI(tokenInfo) {
    const userInfoTab = document.getElementById("user-info-tab");
    if (!userInfoTab || !tokenInfo) return;

    userInfoTab.innerHTML = `
      <div class="token-card-wrapper">
        <div class="token-card-header">
          <h3 class="token-user-title">${tokenInfo.fullname}</h3>
          <div class="token-role-badge">${tokenInfo.role}</div>
        </div>
        
        <div class="token-data-grid">
          <div class="token-data-item">
            <div class="token-info-section">
              <p><span class="token-key">NIM :</span> <span class="token-value">${tokenInfo.username
      }</span></p>
            </div>
          </div>

          <div class="token-data-item">
            <div class="token-info-section">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <p><span class="token-key">Auto Selesai Quiz :</span></p>
                <label class="switch">
                  <input type="checkbox" id="auto-finish-quiz-toggle" ${localStorage.getItem("auto_finish_quiz") === "true"
        ? "checked"
        : ""
      }>
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="token-data-item">
  <div class="token-info-section" style="display: flex; gap: 10px;">
    <button id="update-api-key" class="token-button" style="flex: 1;">
      <i class="fas fa-key"></i> Update API Key
    </button>
    <a href="https://my.unpam.ac.id/presensi/" target="_blank" id="presensi" class="token-button" style="flex: 1; text-align: center; text-decoration: none;">
      <i class="fas fa-clipboard-list"></i> Lihat Presensi
    </a>
  </div>
</div>


        </div>
        
        <div class="token-footer">
          <a href="https://github.com/zhwzein" style="display: flex; align-items: center; text-decoration: none; color: #fff;">
            <span class="token-value">Made with ❤️ </span>
            <span> by Zahwa Zein</span>
          </a>

          <div style="display: flex; align-items: center;">
            <a href="https://instagram.com/zhwzein" class="token-github-link">
              <span class="token-github-icon"><img src="https://img.icons8.com/?size=100&id=dz63urxyxSdO&format=png&color=ffffff" width="18" ></span>
            </a>
            <a href="https://x.com/zhwzein" class="token-github-link">
              <span class="token-github-icon"><img src="https://img.icons8.com/?size=100&id=6Fsj3rv2DCmG&format=png&color=ffffff" width="18" ></span>
            </a>
            <a href="https://github.com/zhwzein" class="token-github-link">
              <span class="token-github-icon"><img src="https://img.icons8.com/?size=100&id=62856&format=png&color=ffffff" width="18" ></span>
            </a>
          </div>
        </div>
      </div>
    `;

    const geminiToggle = document.getElementById("gemini-toggle");
    if (geminiToggle) {
      const savedGeminiState = localStorage.getItem("gemini_enabled") === "true";
      geminiToggle.checked = savedGeminiState;

      // Set initial visibility based on saved state
      const geminiPopup = document.getElementById("geminiChatbot");
      const geminiToggleBtn = document.getElementById("geminiChatbotToggle");

      if (savedGeminiState) {
        // If Gemini was enabled, show only the toggle button
        if (geminiToggleBtn) {
          geminiToggleBtn.style.display = "flex";
        }
        if (geminiPopup) {
          geminiPopup.style.display = "none";
        }
      } else {
        // If Gemini was disabled, hide both
        if (geminiToggleBtn) {
          geminiToggleBtn.style.display = "none";
        }
        if (geminiPopup) {
          geminiPopup.style.display = "none";
        }
      }

      geminiToggle.addEventListener("change", function () {
        const isEnabled = this.checked;
        localStorage.setItem("gemini_enabled", isEnabled);

        // When toggle is enabled, only show the toggle button
        const geminiToggleBtn = document.getElementById("geminiChatbotToggle");
        if (geminiToggleBtn) {
          geminiToggleBtn.style.display = isEnabled ? "flex" : "none";
        }

        // Always keep the chat interface hidden when toggle state changes
        const geminiPopup = document.getElementById("geminiChatbot");
        if (geminiPopup) {
          geminiPopup.style.display = "none";
        }
      });
    }

    // Toggle Auto Selesai Quiz
    const autoFinishQuizToggle = document.getElementById(
      "auto-finish-quiz-toggle"
    );
    if (autoFinishQuizToggle) {
      autoFinishQuizToggle.checked =
        localStorage.getItem("auto_finish_quiz") === "true";
      autoFinishQuizToggle.addEventListener("change", function () {
        localStorage.setItem("auto_finish_quiz", this.checked);
      });
    }

    // Add click event to toggle button to show chat interface
    const geminiToggleBtn = document.getElementById("geminiChatbotToggle");
    if (geminiToggleBtn) {
      geminiToggleBtn.addEventListener("click", function () {
        const geminiPopup = document.getElementById("geminiChatbot");
        if (geminiPopup) {
          geminiPopup.style.display = "flex";
        }
      });
    }

    const updateApiKeyBtn = document.getElementById("update-api-key");
    if (updateApiKeyBtn) {
      updateApiKeyBtn.addEventListener("click", function () {
        // Call showApiKeyPopup from apiKeyManager.js
        if (typeof showApiKeyPopup === "function") {
          showApiKeyPopup();
        } else {
          console.error(
            "showApiKeyPopup function not found. Make sure apiKeyManager.js is loaded."
          );
        }
      });
    }
  }

  function chatAI() {
    const tab = document.getElementById("chat-ai-tab");
    if (!tab) return;

    // Ambil API key dari localStorage (disimpan base64)
    const storedKey = localStorage.getItem("geminiApiKey");
    const apiKey = storedKey ? atob(storedKey) : null;
    if (!apiKey) {
      tab.innerHTML = "<p style='color:red; padding:12px;'>API key Gemini belum tersedia di localStorage!</p>";
      return;
    }

    // Render UI (tab sebagai area scroll, template mengambang di atas input)
    tab.innerHTML = `
      <style>
        /* Tab & messages */
        #chat-ai-tab {
          position: relative;
          height: 100vh;
          overflow-y: auto; /* <-- scroll di tab */
          padding-bottom: 140px; /* ruang untuk template + input */
          background: #1e1e1e;
          color: #eee;
          font-family: Arial, sans-serif;
        }
        #chatMessages {
          min-height: 220px; /* tinggi minimum saat kosong */
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
        }
        .message {
          max-width: 78%;
          padding: 10px 14px;
          margin: 4px;
          border-radius: 12px;
          line-height: 1.4;
          font-size: 14px;
          word-wrap: break-word;
          position: relative;
          white-space: pre-wrap;
        }
        .message.user {
          align-self: flex-end;
          background: #0070f3;
          color: white;
          margin-left: auto;
          border-radius: 12px 12px 0 12px;
        }
        .message.bot {
          align-self: flex-start;
          background: #333;
          color: #eee;
          margin-right: auto;
          border-radius: 12px 12px 12px 0;
          padding-right: 44px; /* ruang untuk tombol copy */
        }

        /* Copy button pada pesan bot */
        .copy-btn {
          position: absolute;
          top: 6px;
          right: 8px;
          background: transparent;
          border: none;
          color: #bbb;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }
        .copy-btn:hover { color: #fff; }

        /* Template area (floating di atas input) */
        #templateArea {
          position: fixed;
          bottom: 60px; /* di atas input */
          left: 0;
          right: 0;
          padding: 8px 12px;
          background: rgba(30,30,30,0.95);
          border-top: 1px solid #333;
          z-index: 9999;

          display: flex;
          overflow-x: auto;   /* bisa digeser horizontal */
          scrollbar-width: thin; /* firefox */
        }
        #templateArea::-webkit-scrollbar {
          height: 6px;
        }
        #templateArea::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 4px;
        }
        #templateArea::-webkit-scrollbar-track {
          background: transparent;
        }

        .template-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: nowrap;   /* jangan turun ke bawah */
        }
        .template-buttons button {
          flex-shrink: 0; /* biar tidak mengecil */
          background: #444;
          color: #eee;
          border: none;
          border-radius: 16px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          white-space: nowrap; /* jaga satu baris */
        }
        .template-buttons button:hover { background: #666; }
        .template-buttons button.selected {
          background: #0070f3;
          color: white;
          box-shadow: 0 4px 14px rgba(0,112,243,0.18);
        }

        /* Input area fixed bawah */
        #chatInputArea {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 8px;
          background: #252525;
          padding: 10px;
          border-top: 1px solid #333;
          z-index: 9999;
        }
        #chatInput {
          flex: 1;
          background: #1e1e1e;
          color: #eee;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 8px;
          resize: none;
          min-height: 40px;
          max-height: 160px;
          overflow-y: auto;
          line-height: 1.3;
        }
        #chatSend { background: #0070f3; border: none; color: white; border-radius: 8px; width:48px; height:40px; cursor:pointer; }
        #chatSend:hover { background:#005ad1; }
        #clearHistory { background:#444; border:none; color:#eee; border-radius:8px; padding:8px 10px; cursor:pointer; }
        #clearHistory:hover { background:#666; }

        /* Toast */
        .chat-toast {
          position: fixed;
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          z-index: 10000;
          opacity: 0;
          transition: opacity .18s;
        }
        .chat-toast.show { opacity: 1; }
      </style>

      <div id="chatMessages" aria-live="polite"></div>

      <div id="templateArea" aria-hidden="false">
        <div class="template-buttons">
          <button data-prompt="Jelaskan secara singkat dan jelas">Singkat & Jelas</button>
          <button data-prompt="Jelaskan dalam 1 paragraf">1 Paragraf</button>
          <button data-prompt="Jelaskan dalam 2 paragraf">2 Paragraf</button>
          <button data-prompt="Jawab pilihan ganda berikut hanya dengan huruf dan teks misal Jawaban yang benar adalah A. ..., dan beri penjelasan singkat ">Pilihan ganda</button>
          <button data-prompt="Sebutkan 3 poin utama yang perlu diketahui secara singkat">3 Poin Utama</button>
          <button data-prompt="Jelaskan dengan cara yang mudah dimengerti dengan singkat">Sederhana</button>
          <button data-prompt="Berikan contoh nyata atau kasus penggunaan dengan singkat">Contoh Nyata</button>
          <button data-prompt="Beri langkah-langkah atau panduan praktis">Panduan Langkah</button>
          <button data-prompt="Jelaskan dengan bahasa yang lebih teknis">Teknis</button>
          <button data-prompt="Sederhanakan dalam bentuk analogi yang mudah dibayangkan">Analogi</button>
          <button data-prompt="Beri penjelasan secara mendalam dan detail">Mendalam</button>
        </div>
      </div>

      <div id="chatInputArea" aria-hidden="false">
        <button id="clearHistory" title="Hapus riwayat">Clear</button>
        <textarea id="chatInput" placeholder="Tulis pertanyaan..." rows="1" aria-label="Tulis pertanyaan"></textarea>
        <button id="chatSend" title="Kirim">➤</button>
      </div>

      <div id="chatToast" class="chat-toast" role="status" aria-live="polite"></div>
    `;

    // Elemen referensi
    const messagesEl = document.getElementById("chatMessages");
    const inputEl = document.getElementById("chatInput");
    const sendBtn = document.getElementById("chatSend");
    const clearBtn = document.getElementById("clearHistory");
    const templateBtns = tab.querySelectorAll(".template-buttons button");
    const toastEl = document.getElementById("chatToast");

    // Helper: show toast (singkat)
    function showToast(text, ms = 1400) {
      toastEl.textContent = text;
      toastEl.classList.add("show");
      setTimeout(() => toastEl.classList.remove("show"), ms);
    }

    // Restore history (HTML saved)
    const savedHistory = localStorage.getItem("gemini_chat_history");
    if (savedHistory) {
      messagesEl.innerHTML = savedHistory;
      restoreCopyButtons(); // re-attach event listeners
      // auto-scroll ke bawah
      tab.scrollTop = tab.scrollHeight;
    }

    function saveHistory() {
      localStorage.setItem("gemini_chat_history", messagesEl.innerHTML);
    }

    // Tambah pesan (opsional noCopy untuk thinking)
    function addMessage(sender, text, opts = {}) {
      const msg = document.createElement("div");
      msg.className = `message ${sender}`;
      // gunakan text node agar restore lebih mudah
      const textNode = document.createTextNode(text);
      msg.appendChild(textNode);

      if (sender === "bot" && !opts.noCopy) {
        // tombol copy
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.type = "button";
        copyBtn.innerHTML = "📋";
        copyBtn.addEventListener("click", () => {
          const txt = text;
          navigator.clipboard.writeText(txt).then(() => {
            copyBtn.innerHTML = "✅";
            showToast("Teks disalin");
            setTimeout(() => (copyBtn.innerHTML = "📋"), 1200);
          }).catch(() => showToast("Gagal menyalin"));
        });
        msg.appendChild(copyBtn);
      }

      messagesEl.appendChild(msg);
      saveHistory();
      // autoscroll tab (bukan container)
      tab.scrollTop = tab.scrollHeight;
    }

    // Restore / attach copy events to buttons that exist in saved HTML
    function restoreCopyButtons() {
      const botMessages = messagesEl.querySelectorAll(".message.bot");
      botMessages.forEach((msg) => {
        const btn = msg.querySelector(".copy-btn");
        // ambil teks dari text node (childNodes[0])
        const text = msg.childNodes[0] ? msg.childNodes[0].textContent : msg.textContent;
        if (btn) {
          if (!btn.dataset.attached) {
            btn.addEventListener("click", () => {
              navigator.clipboard.writeText(text).then(() => {
                btn.innerHTML = "✅";
                showToast("Teks disalin");
                setTimeout(() => (btn.innerHTML = "📋"), 1200);
              }).catch(() => showToast("Gagal menyalin"));
            });
            btn.dataset.attached = "1";
          }
        } else {
          // kalau tidak ada tombol, buat
          const copyBtn = document.createElement("button");
          copyBtn.className = "copy-btn";
          copyBtn.type = "button";
          copyBtn.innerHTML = "📋";
          copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(text).then(() => {
              copyBtn.innerHTML = "✅";
              showToast("Teks disalin");
              setTimeout(() => (copyBtn.innerHTML = "📋"), 1200);
            }).catch(() => showToast("Gagal menyalin"));
          });
          msg.appendChild(copyBtn);
        }
      });
    }

    // Clear history
    clearBtn.addEventListener("click", () => {
      if (confirm("Hapus semua riwayat chat?")) {
        messagesEl.innerHTML = "";
        localStorage.removeItem("gemini_chat_history");
        // clear template selection visual
        templateBtns.forEach((b) => b.classList.remove("selected"));
        inputEl.removeAttribute("data-template");
        showToast("Riwayat dihapus");
      }
    });

    // Auto-resize textarea
    function autoResizeTextarea(el) {
      el.style.height = "auto";
      const h = Math.min(el.scrollHeight, 160);
      el.style.height = h + "px";
    }
    inputEl.addEventListener("input", () => autoResizeTextarea(inputEl));

    // Template selection behavior:
    // - klik -> set data-template pada textarea (dipakai saat kirim)
    // - highlight selected btn
    templateBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const prompt = btn.getAttribute("data-prompt") || btn.textContent;
        // toggle selection
        const already = btn.classList.contains("selected");
        templateBtns.forEach((b) => b.classList.remove("selected"));
        if (!already) {
          btn.classList.add("selected");
          inputEl.setAttribute("data-template", prompt);
          showToast(`Template dipilih: ${btn.textContent}`);
        } else {
          // unselect
          inputEl.removeAttribute("data-template");
          showToast("Template dibatalkan");
        }
        inputEl.focus();
      });
    });

    // Gemini fetch (ke API)
    async function askGemini(promptText) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 1024,
                topP: 0.95,
                topK: 40,
              },
            }),
          }
        );
        const json = await res.json();
        if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
          return json.candidates[0].content.parts[0].text;
        } else if (json.error) {
          return `Error: ${json.error.message || JSON.stringify(json.error)}`;
        } else {
          return "Tidak ada jawaban dari Gemini.";
        }
      } catch (err) {
        return `Request gagal: ${err.message}`;
      }
    }

    // Handle send (bisa dipanggil dengan override text, misal dari template quick-send)
    async function handleSend(textOverride = null) {
      const rawInput = (textOverride !== null) ? textOverride : inputEl.value.trim();
      const selectedTemplate = inputEl.getAttribute("data-template") || "";
      // jika tidak ada teks dan tidak ada template, do nothing
      if (!rawInput && !selectedTemplate) return;

      // Format final prompt:
      // - jika ada template & ada teks -> "TEMPLATE: teks"
      // - jika ada template tapi teks kosong -> template
      // - jika hanya teks -> teks
      let finalPrompt = rawInput;
      if (selectedTemplate) {
        finalPrompt = rawInput ? `${selectedTemplate}: ${rawInput}` : selectedTemplate;
      }

      // Tampilkan user message (pakai rawInput jika ada, else tampilkan template)
      addMessage("user", rawInput || selectedTemplate);

      // Kosongkan input dan reset height (tetap simpan selectedTemplate agar dipakai bila user ingin)
      inputEl.value = "";
      autoResizeTextarea(inputEl);

      // Tambah pesan thinking tanpa tombol copy
      addMessage("bot", "⏳ Sedang berpikir...", { noCopy: true });

      // Panggil API
      const answer = await askGemini(finalPrompt);

      // Replace last bot message (thinking) dengan jawaban dan tambahkan tombol copy
      const lastBot = Array.from(messagesEl.querySelectorAll(".message.bot")).pop();
      if (lastBot) {
        // ganti teks (jaga agar tombol copy nanti ditambahkan)
        lastBot.childNodes[0].textContent = answer;

        // buat tombol copy (jika belum ada)
        let existingBtn = lastBot.querySelector(".copy-btn");
        if (!existingBtn) {
          const copyBtn = document.createElement("button");
          copyBtn.className = "copy-btn";
          copyBtn.type = "button";
          copyBtn.innerHTML = "📋";
          copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(answer).then(() => {
              copyBtn.innerHTML = "✅";
              showToast("Teks disalin");
              setTimeout(() => (copyBtn.innerHTML = "📋"), 1200);
            }).catch(() => showToast("Gagal menyalin"));
          });
          lastBot.appendChild(copyBtn);
        } else {
          // jika btn ada (mis. restored from history) pastikan event terpasang
          if (!existingBtn.dataset.attached) {
            existingBtn.addEventListener("click", () => {
              navigator.clipboard.writeText(answer).then(() => {
                existingBtn.innerHTML = "✅";
                showToast("Teks disalin");
                setTimeout(() => (existingBtn.innerHTML = "📋"), 1200);
              }).catch(() => showToast("Gagal menyalin"));
            });
            existingBtn.dataset.attached = "1";
          }
        }
      }

      saveHistory();
      // scroll ke bawah
      tab.scrollTop = tab.scrollHeight;

      // setelah kirim, hapus template selection (opsional — kalau ingin tetap gunakan, comment baris berikut)
      templateBtns.forEach((b) => b.classList.remove("selected"));
      inputEl.removeAttribute("data-template");
    }

    // Send via button
    sendBtn.addEventListener("click", () => handleSend());

    // Send via Enter (Shift+Enter = newline)
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }


  // Update forum data UI
  function updateForumUI(courseDataList) {
    const forumTab = document.getElementById("forum-data-tab");
    if (!forumTab) return;

    const forumList = document.getElementById("forum-list");
    if (!forumList) return;

    let html = "";

    // Extract day of week from course names and prepare for sorting
    const processedCourses = courseDataList
      .map((courseData) => {
        if (!courseData || !courseData.data) return null;

        // Extract day of week from course name if it exists
        const courseName = courseData.coursename || "";
        const dayMatch = courseName.match(/\(([^)]+)\)/);
        const dayOfWeek = dayMatch ? dayMatch[1] : "";

        // Determine day order (for sorting)
        let dayOrder = 7; // Default value for courses without day
        if (dayOfWeek === "Senin") dayOrder = 1;
        else if (dayOfWeek === "Selasa") dayOrder = 2;
        else if (dayOfWeek === "Rabu") dayOrder = 3;
        else if (dayOfWeek === "Kamis") dayOrder = 4;
        else if (dayOfWeek === "Jumat") dayOrder = 5;
        else if (dayOfWeek === "Sabtu") dayOrder = 6;
        else if (dayOfWeek === "Minggu") dayOrder = 0;

        return {
          ...courseData,
          dayOfWeek,
          dayOrder,
        };
      })
      .filter((course) => course !== null);

    // Sort by day of week
    processedCourses.sort((a, b) => {
      // First sort by day order
      return a.dayOrder - b.dayOrder;
    });

    // Process and filter courses
    processedCourses.forEach((courseData) => {
      if (!courseData || !courseData.data) return;

      const kode_course = courseData.kode_course;
      const courseName = courseData.coursename;

      // Filter sections that have forum discussions with IDs
      const validSections = courseData.data.filter((section) => {
        if (!section.sub_section) return false;

        // Check if any sub-section is a forum discussion with an ID
        const forumWithId = section.sub_section.find(
          (sub) => sub.kode_template === "FORUM_DISKUSI" && sub.id
        );

        // Skip if no forum with ID exists
        if (!forumWithId) return false;

        // Find POST_TEST in the section
        const postTest = section.sub_section.find(
          (sub) => sub.kode_template === "POST_TEST"
        );

        // HIDE CRITERIA 1: Both FORUM_DISKUSI and POST_TEST are completed (true)
        if (
          forumWithId.completion === true &&
          postTest &&
          postTest.completion === true
        ) {
          return false;
        }

        // HIDE CRITERIA 2: FORUM_DISKUSI with ID is completed (true) and POST_TEST exists but has no ID
        if (forumWithId.completion === true && postTest && !postTest.id) {
          return false;
        }

        // HIDE CRITERIA 3: FORUM_DISKUSI has a warningAlert about unavailable forum discussions
        if (
          forumWithId.warningAlert &&
          forumWithId.warningAlert.includes("Soal forum diskusi belum tersedia")
        ) {
          return false;
        }

        return true;
      });

      // Skip this course if there are no valid sections with forum discussions
      if (validSections.length === 0) return;

      // Create a unique ID for this course card
      const courseId = `course-${kode_course}`;

      // Course URL
      const courseUrl = `https://mentari.unpam.ac.id/u-courses/${kode_course}`;

      // Start the course card
      html += `
  <div class="course-card" data-course-name="${courseName}" data-course-url="${courseUrl}">
    <div class="course-header">
      <a href="${courseUrl}" class="course-header-link">
        <h2>${courseName}</h2>
        <p class="course-code">${kode_course}</p>
      </a>
    </div>
    <div class="course-content" id="${courseId}">
  `;

      // Process each valid section
      validSections.forEach((section, sectionIndex) => {
        if (!section.sub_section) return;

        // Create a unique ID for this section
        const sectionId = `section-${kode_course}-${sectionIndex}`;

        // Get the section code for direct section URL
        const kode_section = section.kode_section;
        const sectionUrl = `https://mentari.unpam.ac.id/u-courses/${kode_course}?accord_pertemuan=${kode_section}`;

        html += `
    <div class="section-card">
      <div class="section-header" onclick="toggleSection('${sectionId}', '${courseId}')">
        <h3>${section.nama_section}</h3>
        <span class="section-toggle" id="toggle-${sectionId}">
          <i class="fas fa-chevron-down"></i>
        </span>
      </div>
      <div class="section-content" id="${sectionId}">
        <!-- Direct Section Link Button -->
        <div class="section-direct-link">
          <a href="${sectionUrl}" class="section-link-button">
            <i class="fas fa-external-link-alt"></i> Buka Pertemuan
          </a>
        </div>
    `;

        // Group learning materials (buku, video, ppt, etc.)
        const learningMaterials = section.sub_section.filter((sub) =>
          [
            "BUKU_ISBN",
            "VIDEO_AJAR",
            "POWER_POINT",
            "ARTIKEL_RISET",
            "MATERI_LAINNYA",
          ].includes(sub.kode_template)
        );

        // Filter out learning materials without a valid URL
        const availableLearningMaterials = learningMaterials.filter(
          (material) => material.link
        );

        // Other items
        const otherItems = section.sub_section.filter(
          (sub) =>
            ![
              "BUKU_ISBN",
              "VIDEO_AJAR",
              "POWER_POINT",
              "ARTIKEL_RISET",
              "MATERI_LAINNYA",
            ].includes(sub.kode_template)
        );

        // Display learning materials grouped in one card ONLY if there are available materials
        if (availableLearningMaterials.length > 0) {
          html += `
      <div class="materials-card">
        <h4>Materi Pembelajaran</h4>
        <div class="materials-list">
      `;

          availableLearningMaterials.forEach((material) => {
            let url = material.link;
            let completionStatus = material.completion
              ? "completed"
              : "incomplete";

            html += `
        <a href="${url}" class="material-item ${completionStatus}" 
           data-item-name="${material.judul}" data-item-url="${url}">
          <div class="material-icon">
            ${getMaterialIcon(material.kode_template)}
          </div>
          <div class="material-details">
            <span>${material.judul}</span>
            ${material.completion
                ? '<span class="completion-badge">Selesai</span>'
                : ""
              }
          </div>
        </a>
      `;
          });

          html += `
        </div>
      </div>
      `;
        }

        // Display other items individually
        otherItems.forEach((item) => {
          // Show all items since we're already filtering at the section level
          let url = "";
          let warningMessage = item.warningAlert || "";
          let completionStatus = item.completion ? "completed" : "incomplete";
          let validUrl = false;
          let itemType = getItemTypeText(item.kode_template);

          // Get duration for quiz items (PRE_TEST, POST_TEST)
          let durationText = "";
          if (
            (item.kode_template === "PRE_TEST" ||
              item.kode_template === "POST_TEST") &&
            item.setting_quiz &&
            item.setting_quiz.duration &&
            !item.completion
          ) {
            durationText = `<span class="duration-badge">${item.setting_quiz.duration} menit</span>`;
          }

          // Generate URL based on item type
          switch (item.kode_template) {
            case "PRE_TEST":
            case "POST_TEST":
              url = item.id
                ? `https://mentari.unpam.ac.id/u-courses/${kode_course}/exam/${item.id}`
                : "";
              validUrl = !!item.id;
              break;
            case "FORUM_DISKUSI":
              url = item.id
                ? `https://mentari.unpam.ac.id/u-courses/${kode_course}/forum/${item.id}`
                : "";
              validUrl = !!item.id;
              break;
            case "PENUGASAN_TERSTRUKTUR":
              url = ""; // URL not specified yet
              validUrl = false;
              break;
            case "KUESIONER":
              url = `https://mentari.unpam.ac.id/u-courses/${kode_course}/kuesioner/${section.kode_section}`;
              validUrl = !!section.kode_section;
              break;
          }

          // Add data attributes for the copy function
          let dataAttrs = "";
          if (validUrl) {
            dataAttrs = `data-item-name="${item.judul}" data-item-url="${url}" data-item-type="${itemType}"`;
          }

          html += `
      <div class="item-card ${completionStatus} ${warningMessage ? "has-warning" : ""
            }" ${dataAttrs}>
        <div class="item-header">
          <div class="item-icon">
            ${getItemIcon(item.kode_template)}
          </div>
          <div class="item-details">
            <h4>${item.judul} ${durationText}</h4>
            ${item.completion
              ? '<span class="completion-badge">Selesai</span>'
              : ""
            }
          </div>
        </div>
        
        ${item.konten && item.kode_template === "FORUM_DISKUSI"
              ? `
            <div class="item-content responsive-content">${item.konten}</div>
            <div class="forum-topics" id="forum-topics-${item.id_trx_course_sub_section || item.id
              }">
              <div class="loading-topics">Loading topics...</div>
            </div>
            ${(() => {
                // Fetch topics when rendering forum items
                const forumId = item.id_trx_course_sub_section || item.id;
                if (forumId) {
                  fetchForumTopics(forumId)
                    .then((topics) => {
                      const topicsContainer = document.getElementById(
                        `forum-topics-${forumId}`
                      );
                      if (topicsContainer) {
                        if (topics && topics.length > 0) {
                          topicsContainer.innerHTML = topics
                            .map(
                              (topic) => `
                        <a href="https://mentari.unpam.ac.id/u-courses/${kode_course}/forum/${item.id}/topics/${topic.id}" 
                           class="topic-badge" ><i class="fas fa-comments"></i> 
                          ${topic.judul}
                        </a>
                      `
                            )
                            .join("");
                        } else {
                          topicsContainer.innerHTML =
                            '<div class="no-topics">No topics available</div>';
                        }
                      }
                    })
                    .catch((error) => {
                      console.error(
                        "Error loading topics for forum:",
                        forumId,
                        error
                      );
                      const topicsContainer = document.getElementById(
                        `forum-topics-${forumId}`
                      );
                      if (topicsContainer) {
                        topicsContainer.innerHTML =
                          '<div class="error-topics">Failed to load topics</div>';
                      }
                    });
                }
                return "";
              })()}
            `
              : item.konten
                ? `<div class="item-content responsive-content">${item.konten}</div>`
                : ""
            }
        
        ${warningMessage
              ? `<div class="warning-message">${warningMessage}</div>`
              : ""
            }
        
        ${item.file
              ? `
          <div class="item-file">
            <a href="https://mentari.unpam.ac.id/api/file/${item.file}">
              <i class="fas fa-file-download"></i> Lampiran
            </a>
          </div>
        `
              : ""
            }
        
        ${validUrl && !warningMessage
              ? `
          <div class="item-action">
            <a href="${url}" class="action-button" ${item.kode_template === "PRE_TEST" ||
                item.kode_template === "POST_TEST"
                ? ""
                : item.completion
                  ? "disabled"
                  : ""
              }>
              ${getActionText(item.kode_template)}
            </a>
          </div>
        `
              : validUrl && warningMessage
                ? `
          <div class="item-action">
            <a href="${url}" class="action-button" ${item.kode_template === "PRE_TEST" ||
                  item.kode_template === "POST_TEST"
                  ? ""
                  : "disabled"
                }>
              ${getActionText(item.kode_template)}
            </a>
          </div>
        `
                : `
          <div class="item-action">
            <span class="action-button disabled">
              ${getActionText(item.kode_template)} (Tidak Tersedia)
            </span>
          </div>
        `
            }
      </div>
    `;
        });

        html += `
      </div>
    </div>
    `;
      });

      // Close the course card
      html += `
    </div>
  </div>
  `;
    });

    // Check if there's any content
    if (html === "") {
      forumList.innerHTML = `<div class="forum-no-data">Tidak ada forum diskusi yang tersedia</div>`;
      return;
    }

    forumList.innerHTML = html;

    // Add toggle function to window scope that closes other sections
    window.toggleSection = function (sectionId, courseId) {
      const sectionContent = document.getElementById(sectionId);
      const toggleIcon = document.getElementById(`toggle-${sectionId}`);

      // Get all section contents within this course
      const allSections = document.querySelectorAll(
        `#${courseId} .section-content`
      );
      const allToggles = document.querySelectorAll(
        `#${courseId} .section-toggle`
      );

      // If this section is already active, just close it
      if (sectionContent.classList.contains("active")) {
        sectionContent.classList.remove("active");
        toggleIcon.classList.add("collapsed");
        return;
      }

      // Otherwise, close all sections and open this one
      allSections.forEach((section) => {
        section.classList.remove("active");
      });

      allToggles.forEach((toggle) => {
        toggle.classList.add("collapsed");
      });

      // Open this section
      sectionContent.classList.add("active");
      toggleIcon.classList.remove("collapsed");
    };

    // Add Copy Links functionality
    const copyButton = document.getElementById("copy-all-links");
    if (copyButton) {
      copyButton.addEventListener("click", function () {
        // Collect all course and item links
        let linkText = "";

        // Get all course cards
        const courseCards = document.querySelectorAll(".course-card");

        courseCards.forEach((course) => {
          const courseName = course.getAttribute("data-course-name");
          const courseUrl = course.getAttribute("data-course-url");

          // Add course name and URL
          linkText += `${courseName} : ${courseUrl}\n`;

          // Get all items with URLs
          const items = course.querySelectorAll(
            "[data-item-name][data-item-url]"
          );

          items.forEach((item) => {
            const itemName = item.getAttribute("data-item-name");
            const itemUrl = item.getAttribute("data-item-url");
            const itemType = item.getAttribute("data-item-type") || "";

            // Add item name and URL
            if (itemType) {
              linkText += `${itemType} - ${itemName} : ${itemUrl}\n`;
            } else {
              linkText += `${itemName} : ${itemUrl}\n`;
            }
          });

          // Add a separator between courses
          linkText += "\n";
        });

        // Copy to clipboard
        navigator.clipboard
          .writeText(linkText)
          .then(() => {
            // Show success message
            copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyButton.classList.add("copied");

            // Reset button after 2 seconds
            setTimeout(() => {
              copyButton.innerHTML =
                '<i class="fas fa-copy"></i> Copy All Links';
              copyButton.classList.remove("copied");
            }, 2000);
          })
          .catch((err) => {
            console.error("Failed to copy links: ", err);
            copyButton.innerHTML = '<i class="fas fa-times"></i> Failed!';

            // Reset button after 2 seconds
            setTimeout(() => {
              copyButton.innerHTML =
                '<i class="fas fa-copy"></i> Copy All Links';
            }, 2000);
          });
      });
    }

    // Add styles - this function needs to be defined elsewhere
    if (typeof addStyles === "function") {
      addStyles();
    }

    // Helper functions
    function getMaterialIcon(templateType) {
      switch (templateType) {
        case "BUKU_ISBN":
          return '<i class="fas fa-book"></i>';
        case "VIDEO_AJAR":
          return '<i class="fas fa-video"></i>';
        case "POWER_POINT":
          return '<i class="fas fa-file-powerpoint"></i>';
        case "ARTIKEL_RISET":
          return '<i class="fas fa-file-alt"></i>';
        case "MATERI_LAINNYA":
          return '<i class="fas fa-folder-open"></i>';
        default:
          return '<i class="fas fa-file"></i>';
      }
    }

    function getItemIcon(templateType) {
      switch (templateType) {
        case "PRE_TEST":
        case "POST_TEST":
          return '<i class="fas fa-tasks"></i>';
        case "FORUM_DISKUSI":
          return '<i class="fas fa-comments"></i>';
        case "PENUGASAN_TERSTRUKTUR":
          return '<i class="fas fa-clipboard-list"></i>';
        case "KUESIONER":
          return '<i class="fas fa-poll"></i>';
        default:
          return '<i class="fas fa-file"></i>';
      }
    }

    function getActionText(templateType) {
      switch (templateType) {
        case "PRE_TEST":
        case "POST_TEST":
          return "Mulai Quiz"; // Always show "Mulai Quiz" for PRE_TEST and POST_TEST
        case "FORUM_DISKUSI":
          return "Buka Forum";
        case "PENUGASAN_TERSTRUKTUR":
          return "Lihat Tugas";
        case "KUESIONER":
          return "Isi Kuesioner";
        default:
          return "Buka";
      }
    }

    function getItemTypeText(templateType) {
      switch (templateType) {
        case "PRE_TEST":
          return "Pretest";
        case "POST_TEST":
          return "Posttest";
        case "FORUM_DISKUSI":
          return "Forum Diskusi";
        case "PENUGASAN_TERSTRUKTUR":
          return "Penugasan Terstruktur";
        case "KUESIONER":
          return "Kuesioner";
        default:
          return "";
      }
    }

    function addStyles() {
      // Check if styles are already added
      if (document.getElementById("forum-ui-styles")) return;

      const styleElement = document.createElement("style");
      styleElement.id = "forum-ui-styles";
      styleElement.textContent = `
      /* Forum UI Dark Theme - Max width 500px with Collapsible Sections */
      /* Course Card Styles */
      .course-card {
        background: #1f2937;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        margin-bottom: 8px;
        overflow: hidden;
        width: 100%;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
        border: 1.5px solid rgba(255, 255, 255, 0.08);
        box-sizing: border-box;
      }
      
      .course-header {
        padding: 8px;
        background: #1f2937;
        // border-left: 4px solid #0070f3;
        margin-bottom: 0;
        width: 100%;
        box-sizing: border-box;
      }
      
      .course-header-link {
        display: block;
        text-decoration: none;
        cursor: pointer;
        color: inherit;
        transition: all 0.2s;
      }
      
      // .course-header-link:hover {
      //   background: #303030;
      // }
      
      .course-header h2 {
        margin: 0;
        font-size: 14px;
        color: #eee;
      }
      
      .course-code {
        color: #aaa;
        font-size: 10px;
        margin: 0;
      }
      
      .course-content {
        padding: 0 8px 8px;
      }
      
      .section-card {
        background: #252525;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        width: 100%;
        margin-top: 8px;
        border: 1px solid #333;
        box-sizing: border-box;
        transition: opacity 0.5s ease-out;
      }
      
      .section-hiding {
        opacity: 0;
      }
      
      .section-header {
        background: #252525;
        color: white;
        padding: 6px 8px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .section-header h3 {
        margin: 0;
        font-size: 12px;
      }
      
      .section-toggle {
        color: white;
        transition: transform 0.3s;
      }
      
      .section-toggle.collapsed {
        transform: rotate(-90deg);
      }
      
      .section-content {
        padding: 8px;
        display: none;
      }
      
      .section-content.active {
        display: block;
      }
      
      /* Section direct link button */
      .section-direct-link {
        margin-bottom: 10px;
        text-align: center;
      }
      
      .section-link-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: #0070f3;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 12px;
        transition: all 0.2s;
        width: 100%;
        box-sizing: border-box;
      }
      
      .section-link-button:hover {
        background: #0060df;
        transform: translateY(-2px);
      }
      
      /* Make images in forum content responsive */
      .responsive-content img {
        max-width: 100% !important;
        height: auto !important;
        width: 100% !important;
        margin: 10px 0;
        border-radius: 4px;
      }
      
      .materials-card {
        background: #1e1e1e;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
        border: 1px solid #333;
        width: 100%;
        box-sizing: border-box;
      }
      
      .materials-card h4 {
        margin-top: 0;
        margin-bottom: 12px;
        color: #eee;
        font-size: 15px;
      }
      
      .materials-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }
      
      .material-item {
        display: flex;
        align-items: center;
        padding: 10px;
        background: #252525;
        border-radius: 4px;
        text-decoration: none;
        color: #eee;
        transition: all 0.2s;
        border: 1px solid #333;
        width: 100%;
        box-sizing: border-box;
      }
      
      .material-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        background: #282828;
      }
      
      .material-icon {
        margin-right: 10px;
        color: #0070f3;
        flex-shrink: 0;
      }
      
      .material-details {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }
      
      .item-card {
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 8px;
        width: 100%;
        box-sizing: border-box;
      }
      
      .item-header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .item-icon {
        background: #252525;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        color: #0070f3;
        flex-shrink: 0;
      }
      
      .item-details {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .item-details h4 {
        margin: 0;
        font-size: 14px;
        color: #eee;
      }
      
      .item-content {
        border-left: 3px solid #333;
        padding-left: 12px;
        
        margin: 12px 0;
        color: #aaa;
        font-size: 13px;
      }
      
      .item-file {
        margin: 12px 0;
      }
      
      .item-file a {
        color: #0070f3;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }
      
      .item-action {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
      
      .action-button {
        background: #0070f3;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        text-decoration: none;
        transition: all 0.2s;
        font-size: 12px;
      }
      
      .action-button:hover {
        background: #0060df;
      }
      
      .action-button.disabled {
        background: #333;
        color: #777;
        cursor: not-allowed;
      }
      
      .completion-badge {
        background: #00a550;
        color: white;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        white-space: nowrap;
      }
      
      .duration-badge {
        background: #ff9800;
        color: white;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        margin-left: 8px;
        white-space: nowrap;
      }
      
      .warning-message {
        background: #332b00;
        color: #ffd166;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        font-size: 13px;
        border: 1px solid #554800;
      }
      
      .completed {
        border-left: 3px solid #00a550;
      }
      
      .has-warning {
        border-left: 3px solid #ffd166;
      }
      
      .forum-no-data {
        padding: 20px;
        text-align: center;
        color: #999;
        font-style: italic;
        max-width: 500px;
        margin: 0 auto;
      }
      
      /* Container for the entire forum */
      #forum-list {
        max-width: 500px;
        margin: 0 auto;
        box-sizing: border-box;
        width: 100%;
        margin-bottom: 125px;
      }
      
      /* Copy links button */
      .copy-links-container {
        background: #0070f3;
        border-radius: 4px;
        text-align: center;
        display: flex;
        gap: 0.5em;
      }
      
      .copy-links-button {
        background: #0070f3;
        color: white;
        border: none;
        width: 100%;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }
      
      .copy-links-button:hover {
        background: #0060df;
        // transform: translateY(-2px);
      }
      
      .copy-links-button.copied {
        background: #00a550;
      }

      .presensi-button {
        color: white;
        border: none;
        width: 100%;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        text-decoration: none;
      }
      
      .presensi-button:hover {
        background: #0060df;
        // transform: translateY(-2px);
      }
      
      /* Responsive adjustments */
      @media (max-width: 480px) {
        .course-header h2 {
          font-size: 12px;
        }
        
        .section-header h3 {
          font-size: 12px;
        }
        
        .materials-card h4 {
          font-size: 12px;
        }
        
        .item-details h4 {
          font-size: 12px;
        }
        
        .action-button {
          padding: 6px 12px;
          font-size: 12px;
        }
      }

      /* Switch styles */
      .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }

      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
      }

      input:checked + .slider {
        background-color: #0070f3;
      }

      input:checked + .slider:before {
        transform: translateX(26px);
      }

      .slider.round {
        border-radius: 24px;
      }

      .slider.round:before {
        border-radius: 50%;
      }

      .token-button {
        background: #0070f3;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s;
      }

      .token-button:hover {
        background: #0060df;
        transform: translateY(-1px);
      }
      
      /* Forum Topics Styles */
      .forum-topics {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .loading-topics,
      .no-topics,
      .error-topics {
        color: #666;
        font-size: 12px;
        font-style: italic;
      }
      
      .error-topics {
        color: #f43f5e;
      }
      
      .topic-badge {
        background: rgba(255, 255, 255, 0.71);
        color: #252525;
        padding: 4px 8px;
       
        border-radius: 5px;
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;
        cursor: pointer;
      }
      
      .topic-badge:hover {
        background: rgba(56, 56, 56, 0.65);
        transform: translateY(-1px);
        color:rgb(255, 255, 255);
        text-decoration: none;
        box-shadow: 0 2px 4px rgba(255, 255, 255, 0.2);
      }
    `;

      document.head.appendChild(styleElement);
    }
  }


  // Function to create and display groups with improved distribution logic


  // Function to copy text to clipboard and show notification



  // Function to copy text to clipboard and show notification


  // Function to show toast notification


  // Save token and display user info
  function saveToken(token, source) {
    if (!token) return;
    if (token.startsWith("Bearer ")) token = token.substring(7);

    const tokenInfo = decodeToken(`Bearer ${token}`);
    if (!tokenInfo) return;

    if (authToken !== token) {
      authToken = token;
      userInfo = tokenInfo;

      console.log("Token: " + token);
      console.log("Info Pengguna:");
      console.log(`- Nama: ${tokenInfo.fullname}`);
      console.log(`- Username: ${tokenInfo.username}`);
      console.log(`- Role: ${tokenInfo.role}`);
      console.log(`- Expired: ${tokenInfo.expires}`);

      // Simpan token dan userInfo ke localStorage
      saveToLocalStorage(STORAGE_KEYS.AUTH_TOKEN, token);
      saveToLocalStorage(STORAGE_KEYS.USER_INFO, tokenInfo);

      // Update UI
      updateTokenUI(token, tokenInfo);
      updateUserInfoUI(tokenInfo);
      chatAI(tokenInfo);
      // Fetch courses data after token is captured (if belum ada data)
      const cachedCourseData = getFromLocalStorage(STORAGE_KEYS.COURSE_DATA);
      if (!cachedCourseData || cachedCourseData.length === 0) {
        setTimeout(() => fetchCoursesListAndDetails(), 1000);
      }
    }
  }

  // Fetch individual course data
  async function fetchAndDisplayIndividualCourseData(courseCode) {
    if (!authToken) return null;

    try {
      const apiUrl = `https://mentari.unpam.ac.id/api/user-course/${courseCode}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();

      console.log(`URL: /api/user-course/${courseCode}`);
      console.log(`Kode Course: ${courseCode}`);
      console.log(`Custom URL: ${createCustomUrl(courseCode)}`);
      console.log(`Response:`, data);
      console.log("---");

      return data;
    } catch (error) {
      console.error(`Error fetching course ${courseCode}:`, error);
      return null;
    }
  }

  // Fetch all courses
  async function fetchCoursesListAndDetails(forceRefresh = false) {
    // Cek apakah sudah ada data tersimpan dan tidak dipaksa refresh
    if (!forceRefresh) {
      const cachedCourseData = getFromLocalStorage(STORAGE_KEYS.COURSE_DATA);
      if (cachedCourseData && cachedCourseData.length > 0) {
        console.log(
          "Menggunakan data course dari cache:",
          cachedCourseData.length,
          "courses"
        );
        courseDataList = cachedCourseData;
        updateForumUI(courseDataList);
        return cachedCourseData;
      }
    }

    if (isHandlingCourseApiRequest || !authToken) return;

    try {
      isHandlingCourseApiRequest = true;
      const apiUrl = `https://mentari.unpam.ac.id/api/user-course?page=1&limit=50`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();

      console.log("Total courses: " + data.data.length);

      courseDataList = [];
      for (const course of data.data) {
        const courseData = await fetchAndDisplayIndividualCourseData(
          course.kode_course
        );
        if (courseData) {
          courseDataList.push(courseData);
        }
      }

      // Simpan courseDataList ke localStorage
      saveToLocalStorage(STORAGE_KEYS.COURSE_DATA, courseDataList);
      saveToLocalStorage(STORAGE_KEYS.LAST_UPDATE, new Date().toLocaleString());

      // Update forum UI after fetching all courses
      updateForumUI(courseDataList);
      return data;
    } catch (error) {
      console.error(`Error fetching courses:`, error);
    } finally {
      isHandlingCourseApiRequest = false;
    }
  }

  // Check storages for tokens
  function checkStorages() {
    // Cek apakah ada token yang tersimpan di localStorage
    const savedToken = getFromLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
    const savedUserInfo = getFromLocalStorage(STORAGE_KEYS.USER_INFO);

    if (savedToken && savedUserInfo) {
      authToken = savedToken;
      userInfo = savedUserInfo;

      // Update UI dengan data yang tersimpan
      updateTokenUI(savedToken, savedUserInfo);
      updateUserInfoUI(savedUserInfo);
      chatAI(savedUserInfo);

      // Load course data jika tersedia
      const cachedCourseData = getFromLocalStorage(STORAGE_KEYS.COURSE_DATA);
      if (cachedCourseData && cachedCourseData.length > 0) {
        courseDataList = cachedCourseData;
        updateForumUI(courseDataList);
      }

      return true;
    }

    // Jika tidak ada token tersimpan, lakukan pengecekan seperti biasa
    const possibleKeys = [
      "token",
      "auth_token",
      "authToken",
      "access_token",
      "accessToken",
      "jwt",
      "idToken",
      "id_token",
    ];

    // Check localStorage and sessionStorage for common token keys
    for (const key of possibleKeys) {
      const localValue = localStorage.getItem(key);
      if (localValue) saveToken(localValue, `localStorage.${key}`);

      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue) saveToken(sessionValue, `sessionStorage.${key}`);
    }

    // Check all storage items for JWT format
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      if (typeof value === "string" && value.startsWith("eyJ")) {
        saveToken(value, `localStorage.${key}`);
      }
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      if (typeof value === "string" && value.startsWith("eyJ")) {
        saveToken(value, `sessionStorage.${key}`);
      }
    }

    return false;
  }

  // Intercept XHR requests
  function interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function () {
      this._method = arguments[0];
      this._url = arguments[1];
      this._headers = {};
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
      this._headers = this._headers || {};
      this._headers[header] = value;

      if (header.toLowerCase() === "authorization" && value) {
        saveToken(value, `XHR Request`);
      }

      return originalSetRequestHeader.apply(this, arguments);
    };
  }

  // Intercept Fetch API
  function interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = function (resource, init = {}) {
      const url = typeof resource === "string" ? resource : resource.url;

      if (init && init.headers) {
        let authHeader = null;

        if (init.headers instanceof Headers) {
          authHeader =
            init.headers.get("authorization") ||
            init.headers.get("Authorization");
        } else if (typeof init.headers === "object") {
          authHeader = init.headers.authorization || init.headers.Authorization;
        }

        if (authHeader) {
          saveToken(authHeader, `Fetch Request`);
        }
      }

      return originalFetch.apply(this, arguments);
    };
  }

  // Auto click the Dashboard button (hanya jika data belum ada)
  function clickDashboardButton() {
    // Cek apakah sudah ada data tersimpan
    const cachedCourseData = getFromLocalStorage(STORAGE_KEYS.COURSE_DATA);
    if (cachedCourseData && cachedCourseData.length > 0) {
      console.log(
        "Data course sudah tersedia, tidak perlu klik dashboard otomatis"
      );
      return;
    }

    // Find and click the Dashboard button
    const dashboardButtons = Array.from(document.querySelectorAll("button"));
    const dashboardButton = dashboardButtons.find((button) => {
      const spanElement = button.querySelector("span.MuiTypography-root");
      return spanElement && spanElement.textContent === "Dashboard";
    });

    if (dashboardButton) {
      console.log("Dashboard button ditemukan! Mengklik...");
      dashboardButton.click();
    } else {
      console.warn("Dashboard button tidak ditemukan!");
    }
  }

  // Expose functions to window
  window.toggleTokenPopup = function () {
    const popup = document.getElementById("token-runner-popup");
    if (!popup) {
      createPopupUI();
    } else {
      toggleCollapse();
    }
  };

  window.getAuthToken = function () {
    if (authToken) {
      console.log("Token: " + authToken);
      return authToken;
    } else {
      console.log("Belum ada token yang terdeteksi");
      return null;
    }
  };

  window.checkCourse = function () {
    const courseCode = extractCourseCodeFromUrl(window.location.href);

    if (courseCode) {
      console.log(`Kode Course: ${courseCode}`);
      console.log(`Custom URL: ${createCustomUrl(courseCode)}`);
    } else {
      console.log("Tidak ada kode course pada URL ini");
    }
  };

  window.fetchCourse = function (courseCode) {
    if (!courseCode) {
      console.log(
        "Masukkan kode course. Contoh: fetchCourse('20242-06SIFM003-22SIF0352')"
      );
      return;
    }

    if (!authToken) {
      console.log("Tidak ada token yang terdeteksi");
      return;
    }

    return fetchAndDisplayIndividualCourseData(courseCode);
  };

  window.fetchCoursesList = fetchCoursesListAndDetails;

  // Fungsi untuk menghapus cache data
  window.clearCacheData = function () {
    localStorage.removeItem(STORAGE_KEYS.COURSE_DATA);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
    console.log(
      "Cache data berhasil dihapus. Refresh halaman untuk mengambil data baru."
    );
  };

  // Initialize
  function init() {
    createPopupUI();
    interceptXHR();
    interceptFetch();

    // Cek apakah ada data di localStorage
    const hasExistingData = checkStorages();

    // Jika tidak ada data, coba klik card
    if (!hasExistingData) {
      setTimeout(() => {
        // Temukan elemen dengan kelas "card MuiBox-root"
        let card = document.querySelector(".card.MuiBox-root");

        // Jika ditemukan, klik elemen tersebut
        if (card) {
          console.log("Card ditemukan! Mengklik...");
          card.click();
        } else {
          console.warn("Card tidak ditemukan!");
        }

        // Attempt to click the Dashboard button after a short delay
        setTimeout(() => {
          clickDashboardButton();
        }, 1000);
      }, 1000);
    }
  }

  init();

  function extractTopicsFromContent(content) {
    if (!content) return [];
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    // Extract topics with their IDs
    const topics = [];

    // Look for topic elements with IDs
    const topicElements = tempDiv.querySelectorAll('[id^="topic-"]');
    topicElements.forEach((element) => {
      const id = element.id.replace("topic-", "");
      const text = element.textContent.trim();
      if (text && text.length > 0 && text.length < 100) {
        topics.push({ id, text });
      }
    });

    // If no topic elements found, try to extract from headings/paragraphs
    if (topics.length === 0) {
      const headings = tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6, p");
      headings.forEach((element) => {
        const text = element.textContent.trim();
        if (text && text.length > 0 && text.length < 100) {
          // Generate a unique ID for the topic
          const id = crypto.randomUUID();
          topics.push({ id, text });
        }
      });
    }

    return topics.slice(0, 3);
  }

  // Add this function to fetch topics from API
  async function fetchForumTopics(forumId) {
    try {
      console.log("Fetching topics for forum:", forumId);
      const response = await fetch(
        `https://mentari.unpam.ac.id/api/forum/topic/${forumId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch topics:",
          response.status,
          response.statusText
        );
        throw new Error("Failed to fetch topics");
      }

      const data = await response.json();
      console.log("Topics API response:", data);

      if (!data.topics) {
        console.warn("No topics data in response:", data);
        return [];
      }

      // Filter topics that match the forum's id_trx_course_sub_section
      const matchingTopics = data.topics.filter(
        (topic) => topic.id_trx_course_sub_section === forumId
      );

      console.log("Matching topics:", matchingTopics);
      return matchingTopics;
    } catch (error) {
      console.error("Error fetching forum topics:", error);
      return [];
    }
  }
})();
