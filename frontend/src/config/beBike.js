export const BE_BIKE = Object.freeze({
  name: "Be-Bike",
  price: "NT$12,800",
  lineOaId: "@472rcmwf",
  inventory: Object.freeze({
    totalSellable: 100,
    newUnits: 100,
    retiredUsedUnits: 0,
  }),
  verifiedSpecs: Object.freeze({
    batteryManufacturer: "Han-Win Technology Co., Ltd.",
    batteryModel: "HWT-1003-AW-S35",
    batteryVoltage: "36V",
    batteryCapacity: "10.2Ah",
    batteryEnergy: "367Wh",
    batteryOrigin: "Made in Taiwan",
    tireBrand: "KENDA",
    brakeLeverBrand: "TEKTRO",
    crankBrand: "Prowheel",
    motorPosition: "前輪輪轂馬達",
    range: "約 25 公里",
    maxAssistSpeed: "約 25 km/h",
  }),
  assets: Object.freeze({
    hero: "/be-bike/be-bike-hero.jpg",
    detail: "/be-bike/be-bike-detail.jpg",
    side: "/be-bike/be-bike-side.jpg",
    video: (import.meta.env.VITE_BE_BIKE_VIDEO_URL || "").trim() || "/be-bike/be-bike-demo.mp4",
  }),
});

export function createLineMessageUrl(message) {
  return `https://line.me/R/oaMessage/${BE_BIKE.lineOaId}/?${encodeURIComponent(message)}`;
}

export const LINE_MESSAGES = Object.freeze({
  inventory: "我想查詢 Be-Bike 庫存",
  purchase: "我想購買 Be-Bike",
  human: "我需要 Be-Bike 真人客服協助",
  purchaseConfirmed: "我已閱讀 Be-Bike 購買與售後說明，我要購買",
});
