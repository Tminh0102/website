/**
 * APP.JS - Điều phối và tích hợp toàn bộ ứng dụng Trợ lý giao thông Hồ Con Rùa
 * CHẾ ĐỘ DUY NHẤT: KẾT NỐI API THỰC TẾ
 */

class AppController {
  constructor() {
    this.currentNav = "home";
  }

  init() {
    console.log("Khởi động TP.HCM Digital Twin - Trợ lý giao thông Hồ Con Rùa (Chế độ API Thực tế)...");

    // 1. Khởi tạo các module con
    window.trafficMap.init("trafficMap");
    window.trafficDashboard.init();
    window.weatherManager.init();
    window.incidentReports.init();
    window.trafficAssistant.init();

    // 2. Thiết lập UI routing form
    this.setupRoutingUI();

    // 3. Thiết lập bộ lọc bản đồ
    this.setupMapFilters();

    // 4. Đồng hồ thời gian thực
    this.startRealtimeClock();

    // 5. Navigation cuộn trang và mobile tab bar
    this.setupNavigation();

    // 6. Thiết lập Modal QR Code Sa bàn
    this.setupQrModal();
  }

  // Thiết lập Form tìm tuyến đường thông minh
  setupRoutingUI() {
    const startSelect = document.getElementById("routeStartSelect");
    const endSelect = document.getElementById("routeEndSelect");
    const swapBtn = document.getElementById("swapRoutePointsBtn");
    const calculateBtn = document.getElementById("calculateRouteBtn");

    if (!startSelect || !endSelect) return;

    const landmarks = window.smartRouting.getPredefinedLocations();

    let startHtml = "";
    let endHtml = "";

    landmarks.forEach((item, idx) => {
      startHtml += `<option value="${idx}" ${idx === 0 ? 'selected' : ''}>${item.name}</option>`;
      endHtml += `<option value="${idx}" ${idx === 2 ? 'selected' : ''}>${item.name}</option>`;
    });

    startSelect.innerHTML = startHtml;
    endSelect.innerHTML = endHtml;

    if (swapBtn) {
      swapBtn.addEventListener("click", () => {
        const temp = startSelect.value;
        startSelect.value = endSelect.value;
        endSelect.value = temp;
      });
    }

    if (calculateBtn) {
      calculateBtn.addEventListener("click", () => {
        this.executeRouteCalculation();
      });
    }

    // Chạy thử 1 lần ban đầu
    setTimeout(() => {
      this.executeRouteCalculation();
    }, 1200);
  }

  async executeRouteCalculation() {
    const startSelect = document.getElementById("routeStartSelect");
    const endSelect = document.getElementById("routeEndSelect");
    const vehicleRadio = document.querySelector('input[name="routeVehicle"]:checked');
    const prefSelect = document.getElementById("routePreferenceSelect");
    const resultBox = document.getElementById("routeResultContainer");

    const landmarks = window.smartRouting.getPredefinedLocations();
    const startIndex = parseInt(startSelect.value, 10);
    const endIndex = parseInt(endSelect.value, 10);

    if (startIndex === endIndex) {
      alert("Điểm xuất phát và điểm đến không được trùng nhau.");
      return;
    }

    const start = landmarks[startIndex].coords;
    const end = landmarks[endIndex].coords;
    const vehicle = vehicleRadio ? vehicleRadio.value : "motorbike";
    const preference = prefSelect ? prefSelect.value : "avoid_flood";

    if (resultBox) {
      resultBox.innerHTML = `
        <div class="p-6 text-center text-slate-500">
          <div class="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p class="text-xs">Đang phân tích lưu lượng giao thông thực tế & dữ liệu ngập nước...</p>
        </div>
      `;
    }

    const res = await window.smartRouting.findOptimalRoute(start, end, vehicle, preference);
    this.renderRouteResult(res);
  }

  // Hiển thị kết quả định tuyến
  renderRouteResult(result) {
    const resultBox = document.getElementById("routeResultContainer");
    if (!resultBox || !result) return;

    const primary = result.primary;
    const alt = result.alternative;

    const vehicleLabels = {
      motorbike: "Xe máy",
      car: "Ô tô",
      bike: "Xe đạp / Đi bộ"
    };

    let segmentsHtml = "";
    if (primary.congestedSegments.length > 0) {
      segmentsHtml += `
        <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div class="font-bold flex items-center gap-1.5">
            <svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            Điểm ùn ứ trên tuyến:
          </div>
          <ul class="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
            ${primary.congestedSegments.map(s => `<li><strong>${s.name}:</strong> ${s.issue}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    let floodHtml = "";
    if (primary.floodRisks.length > 0) {
      floodHtml += `
        <div class="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
          <div class="font-bold flex items-center gap-1.5">
            <svg class="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            Nguy cơ ngập trên lộ trình:
          </div>
          <ul class="list-disc list-inside space-y-0.5 text-[11px] text-rose-800">
            ${primary.floodRisks.map(f => `<li><strong>${f.pointName}:</strong> Mực nước ${f.waterLevelCm}cm (${f.statusText})</li>`).join("")}
          </ul>
        </div>
      `;
    }

    let warningHtml = "";
    if (primary.unverifiedWarnings.length > 0) {
      warningHtml += `
        <div class="p-2 bg-blue-50 border border-blue-200 text-[11px] text-blue-900 rounded">
          ℹ️ <strong>Cảnh báo dữ liệu:</strong> ${primary.unverifiedWarnings.join(" ")}
        </div>
      `;
    }

    resultBox.innerHTML = `
      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <div>
            <span class="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Lộ trình đề xuất tối ưu (Dữ liệu thật)</span>
            <div class="text-sm font-bold text-slate-900">Phương tiện: ${vehicleLabels[result.vehicle]}</div>
          </div>
          <div class="text-right">
            <span class="text-xl font-extrabold text-cyan-600">${primary.durationMin}</span>
            <span class="text-xs text-slate-500 font-medium">phút</span>
            <div class="text-[10px] text-slate-400">${primary.distanceKm} km</div>
          </div>
        </div>

        <div class="bg-cyan-50/70 p-2.5 rounded-lg border border-cyan-200/60 text-xs text-cyan-950 leading-relaxed">
          <strong>Lý do lựa chọn:</strong> ${primary.reasoning}
        </div>

        ${segmentsHtml}
        ${floodHtml}
        ${warningHtml}

        ${alt ? `
          <div class="pt-2 border-t text-xs">
            <div class="font-semibold text-slate-700 flex justify-between items-center mb-1">
              <span>Tuyến thay thế dự phòng:</span>
              <span class="font-bold text-slate-900">${alt.durationMin} phút (${alt.distanceKm} km)</span>
            </div>
            <p class="text-[11px] text-slate-500">${alt.reasoning}</p>
          </div>
        ` : ''}

        <div class="flex gap-2 pt-2 border-t">
          <button onclick="document.getElementById('mapSection').scrollIntoView({ behavior: 'smooth' })" class="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 rounded-lg text-xs text-center transition flex items-center justify-center gap-1.5">
            <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
            Xem lộ trình trên bản đồ
          </button>
        </div>
      </div>
    `;

    // Cập nhật lời khuyên trợ lý
    window.trafficAssistant.speak(`Đã tìm thấy lộ trình di chuyển thực tế: Dự kiến mất ${primary.durationMin} phút (${primary.distanceKm} km). ${primary.reasoning}`);
  }

  // Thiết lập bộ lọc trên bản đồ
  setupMapFilters() {
    const filterButtons = document.querySelectorAll(".map-filter-btn");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active-filter", "bg-cyan-600", "text-white"));
        filterButtons.forEach(b => b.classList.add("bg-white", "text-slate-700"));

        btn.classList.add("active-filter", "bg-cyan-600", "text-white");
        btn.classList.remove("bg-white", "text-slate-700");

        const filter = btn.getAttribute("data-filter");
        window.trafficMap.setFilter(filter);
      });
    });
  }

  // Đặt đích đến từ popup bản đồ
  setRouteDestination(lat, lon, name) {
    const endSelect = document.getElementById("routeEndSelect");
    if (!endSelect) return;
    
    document.getElementById("routingSection").scrollIntoView({ behavior: "smooth" });
    
    const landmarks = window.smartRouting.getPredefinedLocations();
    let bestIdx = 0;
    let minDist = 999999;
    landmarks.forEach((lm, idx) => {
      const d = window.trafficStore.getDistanceMeters([lat, lon], lm.coords);
      if (d < minDist) {
        minDist = d;
        bestIdx = idx;
      }
    });

    endSelect.value = bestIdx;
    this.executeRouteCalculation();
  }

  // Đồng hồ thời gian thực
  startRealtimeClock() {
    const clockEl = document.getElementById("headerRealtimeClock");
    const updateTime = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // Xử lý Navigation cuộn trang
  setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").replace("#", "");
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  // Thiết lập Modal QR Code
  setupQrModal() {
    const modal = document.getElementById("qrModal");
    const openBtn = document.getElementById("openQrModalBtn");
    const closeBtn = document.getElementById("closeQrModalBtn");

    if (!modal) return;

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    });
  }
}

// Khởi tạo Singleton App
window.app = new AppController();

document.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
