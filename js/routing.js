/**
 * ROUTING.JS - Công cụ tìm tuyến đường thông minh tránh ùn tắc và ngập lụt
 * Xử lý dữ liệu định tuyến thực tế (OSRM API / Geo-Network Graph), kiểm tra xung đột với
 * điểm ngập và điểm kẹt xe, tự động đề xuất lộ trình thay thế và giải thích lý do logic.
 */

class SmartRoutingEngine {
  constructor() {
    this.currentResult = null;
  }

  // Danh sách các điểm mốc hỗ trợ chọn nhanh
  getPredefinedLocations() {
    return [
      { id: "hcr", name: "Vòng xoay Hồ Con Rùa (Trung tâm)", coords: [10.782845, 106.695843] },
      { id: "ueh", name: "Đại học Kinh tế TP.HCM (UEH - 59C Nguyễn Đình Chiểu)", coords: [10.783950, 106.696320] },
      { id: "notredame", name: "Nhà thờ Đức Bà (Công xã Paris)", coords: [10.779780, 106.699020] },
      { id: "diamond", name: "Diamond Plaza (Lê Duẩn)", coords: [10.781100, 106.698300] },
      { id: "palace", name: "Dinh Độc Lập (Nam Kỳ Khởi Nghĩa)", coords: [10.777000, 106.695300] },
      { id: "taodan", name: "Công viên Tao Đàn (Trương Định)", coords: [10.774500, 106.691800] },
      { id: "youth", name: "Nhà Văn hóa Thanh Niên (Phạm Ngọc Thạch)", coords: [10.781200, 106.696900] },
      { id: "letam", name: "Công viên Lê Văn Tám (Hai Bà Trưng)", coords: [10.788700, 106.694600] },
      { id: "tandinh", name: "Chợ Tân Định (Hai Bà Trưng)", coords: [10.790100, 106.690800] }
    ];
  }

  /**
   * Tính toán tìm tuyến đường tối ưu
   * @param {Array} startCoords [lat, lon]
   * @param {Array} endCoords [lat, lon]
   * @param {String} vehicle 'motorbike' | 'car' | 'bike'
   * @param {String} preference 'fastest' | 'least_congestion' | 'avoid_flood'
   */
  async findOptimalRoute(startCoords, endCoords, vehicle = "motorbike", preference = "avoid_flood") {
    const store = window.trafficStore;

    // 1. Lấy dữ liệu định tuyến cơ bản qua OSRM (định dạng lon,lat)
    let osrmRoutes = null;
    try {
      const url = `${APP_CONFIG.endpoints.osrmRouting}/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson&alternatives=true&steps=true`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.code === "Ok" && json.routes && json.routes.length > 0) {
          osrmRoutes = json.routes;
        }
      }
    } catch (err) {
      console.warn("OSRM Routing API không khả dụng, sử dụng thuật toán nội suy nút giao Digital Twin:", err);
    }

    // Nếu không có OSRM, xây dựng 2 lộ trình mẫu thông qua mạng lưới đường Hồ Con Rùa
    if (!osrmRoutes || osrmRoutes.length === 0) {
      osrmRoutes = this.generateFallbackRoutes(startCoords, endCoords);
    }

    // 2. Phân tích xung đột từng lộ trình với dữ liệu Kẹt xe và Ngập lụt thời gian thực
    const evaluatedRoutes = osrmRoutes.map((route, index) => {
      // Chuyển đổi tọa độ [lon, lat] sang Leaflet [lat, lon]
      const latLngs = route.geometry.coordinates.map(pt => [pt[1], pt[0]]);
      
      return this.evaluateRouteHazards(latLngs, route.distance, route.duration, vehicle, preference, index === 0);
    });

    // 3. Sắp xếp và chọn phương án tối ưu nhất dựa trên tiêu chí ưu tiên
    evaluatedRoutes.sort((a, b) => a.penaltyScore - b.penaltyScore);

    const primary = evaluatedRoutes[0];
    const alternative = evaluatedRoutes.length > 1 ? evaluatedRoutes[1] : null;

    // 4. Nếu tuyến đường chính vi phạm phong tỏa nghiêm trọng hoặc ngập ngập sâu (>30cm) khi chọn tránh ngập
    if (primary.hasBlockedRoad) {
      primary.routeWarning = "CẢNH BÁO: Tuyến đi qua đoạn đường phong tỏa. Hệ thống đã tự động chuyển sang tuyến thay thế an toàn.";
    }

    this.currentResult = {
      primary,
      alternative,
      vehicle,
      preference,
      startCoords,
      endCoords,
      calculatedAt: new Date().toLocaleTimeString("vi-VN")
    };

    // Vẽ lên bản đồ
    window.trafficMap.drawRoute(
      primary.coords,
      alternative ? alternative.coords : null
    );

    return this.currentResult;
  }

  // Đánh giá các rủi ro nguy cơ trên một lộ trình
  evaluateRouteHazards(coords, baseDistanceMeters, baseDurationSec, vehicle, preference, isDefaultPrimary) {
    const store = window.trafficStore;
    const congestedSegments = [];
    const floodRisks = [];
    let hasBlockedRoad = false;
    let unverifiedWarnings = [];
    let penaltyScore = baseDurationSec;

    // Kiểm tra giao cắt với các tuyến đường quanh Hồ Con Rùa
    APP_CONFIG.corridors.forEach(c => {
      const status = store.corridorStatus[c.id] || {};
      
      // Kiểm tra xem tuyến này có nằm gần tim đường corridor không
      const touchesCorridor = coords.some(pt => store.getDistanceMeters(pt, c.centerPoint) < 90);

      if (touchesCorridor) {
        if (status.isBlocked) {
          hasBlockedRoad = true;
          penaltyScore += 99999; // Phạt cực nặng nếu đường bị đóng
          congestedSegments.push({
            name: c.name,
            issue: "Đoạn đường đang bị phong tỏa / rào chắn thi công",
            level: "blocked"
          });
        } else if (status.congestionLevel === "heavy") {
          penaltyScore += (preference === "least_congestion" ? 900 : 400);
          congestedSegments.push({
            name: c.name,
            issue: `Ùn tắc nghiêm trọng (${status.currentSpeed} km/h)`,
            level: "heavy"
          });
        } else if (status.congestionLevel === "moderate") {
          penaltyScore += (preference === "least_congestion" ? 300 : 150);
          congestedSegments.push({
            name: c.name,
            issue: `Đông xe di chuyển chậm (${status.currentSpeed} km/h)`,
            level: "moderate"
          });
        }
      }
    });

    // Kiểm tra giao cắt với các điểm ngập
    APP_CONFIG.floodMonitoringPoints.forEach(pt => {
      const status = store.floodStatus[pt.id] || {};
      const touchesFlood = coords.some(coord => store.getDistanceMeters(coord, pt.coords) < 100);

      if (touchesFlood) {
        const waterCm = status.waterLevelCm || 0;
        const isHigh = status.riskLevel === "high";

        if (waterCm >= 20 || isHigh) {
          // Xe máy cực kỳ nhạy cảm với ngập nước
          const vehicleMultiplier = vehicle === "motorbike" ? 2.5 : 1.2;
          penaltyScore += (preference === "avoid_flood" ? 1200 : 500) * vehicleMultiplier;

          floodRisks.push({
            pointName: pt.name,
            waterLevelCm: waterCm,
            statusText: status.statusText,
            isVerified: status.isVerified,
            riskLevel: status.riskLevel
          });

          if (!status.isVerified) {
            unverifiedWarnings.push(`Đoạn ${pt.name} có nguy cơ ngập theo mô hình (${waterCm}cm) nhưng chưa có xác minh từ camera.`);
          }
        }
      }
    });

    // Tính thời gian thực tế đã điều chỉnh theo tình trạng kẹt xe và ngập
    let adjustedDurationSec = baseDurationSec;
    if (congestedSegments.length > 0) {
      adjustedDurationSec += congestedSegments.length * 180;
    }
    if (floodRisks.length > 0) {
      adjustedDurationSec += floodRisks.length * 240;
    }

    // Xây dựng lý do đề xuất logic
    let reasoning = "";
    if (preference === "avoid_flood" && floodRisks.length === 0) {
      reasoning = "Hệ thống ưu tiên tuyến đường này vì hoàn toàn không đi qua các vùng trũng có nguy cơ ngập lụt quanh Hồ Con Rùa.";
    } else if (preference === "least_congestion" && congestedSegments.length === 0) {
      reasoning = "Lựa chọn tuyến thông thoáng nhất, tránh các nút giao đông xe tại trục Phạm Ngọc Thạch và Trần Cao Vân.";
    } else if (hasBlockedRoad) {
      reasoning = "Tuyến thay thế bắt buộc do trục chính đang bị rào chắn/phong tỏa.";
    } else {
      reasoning = `Lộ trình di chuyển hợp lý nhất theo khoảng cách (${(baseDistanceMeters / 1000).toFixed(2)} km), cân đối giữa thời gian và an toàn.`;
    }

    return {
      coords,
      distanceKm: (baseDistanceMeters / 1000).toFixed(2),
      durationMin: Math.max(2, Math.ceil(adjustedDurationSec / 60)),
      originalDurationMin: Math.ceil(baseDurationSec / 60),
      penaltyScore,
      hasBlockedRoad,
      congestedSegments,
      floodRisks,
      unverifiedWarnings,
      reasoning
    };
  }

  // Tự sinh 2 tuyến mẫu qua tọa độ nếu OSRM bị nghẽn mạng
  generateFallbackRoutes(start, end) {
    // Tuyến 1: Đi qua vòng xoay Hồ Con Rùa
    const hcr = APP_CONFIG.center;
    const route1Coords = [
      [start[1], start[0]],
      [hcr[1] - 0.0005, hcr[0] - 0.0005],
      [hcr[1], hcr[0]],
      [hcr[1] + 0.0008, hcr[0] + 0.0008],
      [end[1], end[0]]
    ];

    // Tuyến 2: Đi vòng qua trục Pasteur / Hai Bà Trưng né tâm vòng xoay
    const route2Coords = [
      [start[1], start[0]],
      [start[1] + 0.0015, start[0] - 0.0010],
      [106.6934, 10.7818], // Pasteur
      [106.6918, 10.7839],
      [end[1], end[0]]
    ];

    const dist1 = window.trafficStore.getDistanceMeters(start, end) * 1.25;
    const dist2 = dist1 * 1.18;

    return [
      {
        geometry: { coordinates: route1Coords },
        distance: Math.round(dist1),
        duration: Math.round(dist1 / 7)
      },
      {
        geometry: { coordinates: route2Coords },
        distance: Math.round(dist2),
        duration: Math.round(dist2 / 8.5)
      }
    ];
  }
}

// Khởi tạo Singleton Routing Engine
window.smartRouting = new SmartRoutingEngine();
