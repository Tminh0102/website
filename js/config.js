/**
 * CONFIG.JS - Cấu hình hệ thống Trợ lý giao thông Hồ Con Rùa
 * Dự án: TP.HCM Digital Twin - Khu vực Hồ Con Rùa
 */

const APP_CONFIG = {
  appName: "Trợ lý giao thông - Hồ Con Rùa",
  project: "TP.HCM Digital Twin",
  center: [10.782845, 106.695843], // Tọa độ trung tâm Hồ Con Rùa (Công trường Quốc Tế)
  defaultZoom: 16,
  minZoom: 14,
  maxZoom: 19,
  
  // API Keys được cung cấp
  apiKeys: {
    vietmap: "a4a3a35f4ce9f30472cf3cca93991c19fefcb545fc33d640",
    tomtom: "FhH96we4j26GXTbHrz0e7jdDWPjcHLlo"
  },

  // Endpoints dịch vụ
  endpoints: {
    // Vietmap Tile API (Raster / Vector rasterized)
    vietmapTile: "https://maps.vietmap.vn/tm/{z}/{x}/{y}@2x.png?apikey={apikey}",
    // Fallback CartoDB Positron / OSM mượt mà phong cách Digital Twin
    cartoDarkTile: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    osmTile: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    
    // TomTom Traffic Flow API
    tomtomTrafficFlow: "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json",
    // TomTom Routing API
    tomtomRouting: "https://api.tomtom.com/routing/1/calculateRoute",
    // OSRM Routing công cộng (fallback mạnh mẽ)
    osrmRouting: "https://router.project-osrm.org/route/v1/driving",
    // Open-Meteo Weather API (Real-time & forecast không cần key)
    openMeteo: "https://api.open-meteo.com/v1/forecast"
  },

  // Danh mục điểm quan trọng quanh Hồ Con Rùa
  landmarks: [
    { id: "hcr_roundabout", name: "Vòng xoay Hồ Con Rùa", coords: [10.782845, 106.695843], type: "landmark" },
    { id: "ueh_campus", name: "Đại học Kinh tế TP.HCM (UEH)", coords: [10.783950, 106.696320], type: "landmark" },
    { id: "notredame", name: "Nhà thờ Đức Bà", coords: [10.779780, 106.699020], type: "landmark" },
    { id: "diamond_plaza", name: "Diamond Plaza (Lê Duẩn)", coords: [10.781100, 106.698300], type: "landmark" },
    { id: "unification_palace", name: "Dinh Độc Lập", coords: [10.777000, 106.695300], type: "landmark" },
    { id: "tao_dan_park", name: "Công viên Tao Đàn", coords: [10.774500, 106.691800], type: "landmark" },
    { id: "youth_cultural_house", name: "Nhà Văn hóa Thanh Niên", coords: [10.781200, 106.696900], type: "landmark" },
    { id: "le_van_tam_park", name: "Công viên Lê Văn Tám", coords: [10.788700, 106.694600], type: "landmark" }
  ],

  // Các tuyến đường kết nối trực tiếp với Hồ Con Rùa
  corridors: [
    {
      id: "rd_pnt_north",
      name: "Phạm Ngọc Thạch (Đoạn Hồ Con Rùa ➜ Điện Biên Phủ)",
      shortName: "Phạm Ngọc Thạch (Bắc)",
      lengthMeters: 450,
      baseSpeed: 40,
      path: [
        [10.782845, 106.695843],
        [10.784400, 106.694700],
        [10.786500, 106.693150]
      ],
      centerPoint: [10.7846, 106.6945]
    },
    {
      id: "rd_pnt_south",
      name: "Phạm Ngọc Thạch (Đoạn Hồ Con Rùa ➜ Nhà thờ Đức Bà)",
      shortName: "Phạm Ngọc Thạch (Nam)",
      lengthMeters: 380,
      baseSpeed: 35,
      path: [
        [10.782845, 106.695843],
        [10.781150, 106.697050],
        [10.779800, 106.698050]
      ],
      centerPoint: [10.7813, 106.6969]
    },
    {
      id: "rd_vvt_west",
      name: "Võ Văn Tần (Đoạn Hồ Con Rùa ➜ Bà Huyện Thanh Quan)",
      shortName: "Võ Văn Tần (Tây)",
      lengthMeters: 550,
      baseSpeed: 38,
      path: [
        [10.782845, 106.695843],
        [10.781800, 106.694400],
        [10.779600, 106.691450]
      ],
      centerPoint: [10.7812, 106.6936]
    },
    {
      id: "rd_tcv_east",
      name: "Trần Cao Vân (Đoạn Hồ Con Rùa ➜ Hai Bà Trưng)",
      shortName: "Trần Cao Vân (Đông)",
      lengthMeters: 320,
      baseSpeed: 35,
      path: [
        [10.782845, 106.695843],
        [10.783850, 106.697200],
        [10.784750, 106.698400]
      ],
      centerPoint: [10.7838, 106.6971]
    },
    {
      id: "rd_tcv_west",
      name: "Trần Cao Vân (Đoạn Hồ Con Rùa ➜ Trương Định)",
      shortName: "Trần Cao Vân (Tây)",
      lengthMeters: 400,
      baseSpeed: 35,
      path: [
        [10.782845, 106.695843],
        [10.780950, 106.694200],
        [10.779200, 106.692300]
      ],
      centerPoint: [10.7810, 106.6943]
    },
    {
      id: "rd_roundabout",
      name: "Vòng xoay Công trường Quốc Tế (Lòng hồ Con Rùa)",
      shortName: "Vòng xoay Hồ Con Rùa",
      lengthMeters: 180,
      baseSpeed: 25,
      path: [
        [10.782845, 106.695843],
        [10.783150, 106.695950],
        [10.783100, 106.695600],
        [10.782700, 106.695500],
        [10.782600, 106.695900],
        [10.782845, 106.695843]
      ],
      centerPoint: [10.782845, 106.695843]
    },
    {
      id: "rd_pasteur",
      name: "Pasteur (Đoạn Nguyễn Thị Minh Khai ➜ Điện Biên Phủ)",
      shortName: "Đường Pasteur",
      lengthMeters: 620,
      baseSpeed: 40,
      path: [
        [10.779900, 106.694800],
        [10.781700, 106.693450],
        [10.783900, 106.691850]
      ],
      centerPoint: [10.7818, 106.6934]
    },
    {
      id: "rd_hbt",
      name: "Hai Bà Trưng (Đoạn Nguyễn Thị Minh Khai ➜ Điện Biên Phủ)",
      shortName: "Đường Hai Bà Trưng",
      lengthMeters: 650,
      baseSpeed: 35,
      path: [
        [10.782200, 106.699800],
        [10.784750, 106.698400],
        [10.786900, 106.697150]
      ],
      centerPoint: [10.7847, 106.6983]
    }
  ],

  // Các điểm trũng thoát nước / điểm giám sát ngập
  floodMonitoringPoints: [
    {
      id: "fl_01",
      name: "Giao lộ Trần Cao Vân - Hai Bà Trưng",
      coords: [10.784750, 106.698400],
      elevationMeter: 1.8, // Địa hình trũng hơn so với trung tâm
      drainageCapacity: "Trung bình",
      riskFormulaWeight: 1.3
    },
    {
      id: "fl_02",
      name: "Trục Võ Văn Tần (Đoạn gần Pasteur)",
      coords: [10.781800, 106.694400],
      elevationMeter: 2.1,
      drainageCapacity: "Tốt",
      riskFormulaWeight: 0.9
    },
    {
      id: "fl_03",
      name: "Lối thoát nước Vòng xoay Hồ Con Rùa",
      coords: [10.782845, 106.695843],
      elevationMeter: 2.4,
      drainageCapacity: "Cao",
      riskFormulaWeight: 0.7
    },
    {
      id: "fl_04",
      name: "Phạm Ngọc Thạch (Đoạn giao Nguyễn Đình Chiểu)",
      coords: [10.784400, 106.694700],
      elevationMeter: 1.9,
      drainageCapacity: "Trung bình",
      riskFormulaWeight: 1.15
    },
    {
      id: "fl_05",
      name: "Hai Bà Trưng (Đoạn giao Nguyễn Thị Minh Khai)",
      coords: [10.782200, 106.699800],
      elevationMeter: 1.7,
      drainageCapacity: "Thấp",
      riskFormulaWeight: 1.4
    }
  ]
};

// Đóng băng cấu hình để tránh ghi đè ngoài ý muốn
Object.freeze(APP_CONFIG);
