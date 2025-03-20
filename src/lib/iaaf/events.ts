
// Define event lists and categories

// Men-only events
export const menOnlyEvents = [
  "Hept. sh", // Indoor Heptathlon
  "Dec.", // Decathlon
  "110mH", // 110m Hurdles
];

// Women-only events
export const womenOnlyEvents = [
  "Pent. sh", // Indoor Pentathlon
  "100mH", // 100m Hurdles
  "Hept.", // Outdoor Heptathlon
];

// Indoor events
export const indoorEvents = [
  // Sprints
  "50m",
  "55m",
  "60m",
  "50mH",
  "55mH",
  "60mH",
  "200m sh",
  "300m sh",
  "400m sh",

  // Mid-distance
  "500m sh",
  "600m sh",
  "800m sh",
  "1000m sh",
  "1500m sh",
  "Mile sh",
  "2000m sh",

  // Distance
  "3000m sh",
  "2 Miles sh",
  "5000m sh",

  // Field Events
  "HJ",
  "PV",
  "LJ",
  "TJ",
  "SP",
  // Combined Events
  "Pent. sh",
  "Hept. sh",

  // Relays
  "4x200m sh",
  "4x400m sh",
  "4x400mix sh",
];

// Outdoor events
export const outdoorEvents = [
  // Sprints
  "100m",
  "100mH",
  "110mH",
  "200m",
  "300m",
  "400m",
  "400mH",

  // Mid-distance
  "500m",
  "600m",
  "800m",
  "1000m",
  "1500m",
  "Mile",
  "2000m",
  "2000m SC",

  // Distance
  "3000m",
  "3000m SC",
  "2 Miles",
  "5000m",
  "10000m",

  // Field Events
  "HJ",
  "PV",
  "LJ",
  "TJ",
  "SP",
  "DT",
  "HT",
  "JT",
  // Combined Events
  "Pent. sh",
  "Hept.",
  "Dec.",

  // Road Events
  "Road Marathon",
  "Road HM",
  "Road Mile",
  "Road 5 km",
  "Road 10 km",
  "Road 15 km",
  "Road 20 km",
  "Road 25 km",
  "Road 30 km",
  "Road 100 km",

  // Race Walks - Track
  "3000mW",
  "5000mW",
  "10,000mW",
  "15,000mW",
  "20,000mW",
  "30,000mW",
  "35,000mW",
  "50,000mW",

  // Road Race Walks
  "Road 3kmW",
  "Road 5kmW",
  "Road 10kmW",
  "Road 15kmW",
  "Road 20kmW",
  "Road 30kmW",
  "Road 35kmW",
  "Road 50kmW",

  // Relays
  "4x100m",
  "4x200m",
  "4x400m",
  "4x400mix",
];

export const order = {
  outdoor: outdoorEvents,
  indoor: indoorEvents,
};

// Helper function to check if event is valid for gender
export const isEventValidForGender = (event: string, isMale: boolean) => {
  if (isMale) {
    return !womenOnlyEvents.includes(event);
  }
  return !menOnlyEvents.includes(event);
};
