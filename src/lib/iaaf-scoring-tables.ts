
// IAAF Scoring Tables for Athletics (2025 version)
// Source: https://github.com/jchen1/iaaf-scoring-tables/blob/master/iaaf-2025.json

type IAFScoringEntry = {
  time: number;  // time in seconds
  score: number;
};

type ScoringTable = {
  men: {
    [distance: string]: IAFScoringEntry[];
  };
  women: {
    [distance: string]: IAFScoringEntry[];
  };
};

// Constants for recognized distances
export const DISTANCE_MAPPINGS: { [key: string]: string } = {
  "5K": "track5000",
  "10K": "road10000",
  "Half Marathon": "roadHalfMarathon",
  "Marathon": "roadMarathon"
};

// Full IAAF scoring table data
export const iaafScoringTables: ScoringTable = {
  "men": {
    "track5000": [
      {"time": 756.95, "score": 1000},
      {"time": 763.27, "score": 990},
      {"time": 769.69, "score": 980},
      {"time": 776.22, "score": 970},
      {"time": 782.86, "score": 960},
      {"time": 789.61, "score": 950},
      {"time": 796.47, "score": 940},
      {"time": 803.44, "score": 930},
      {"time": 810.53, "score": 920},
      {"time": 817.73, "score": 910},
      {"time": 825.05, "score": 900},
      {"time": 832.49, "score": 890},
      {"time": 840.04, "score": 880},
      {"time": 847.71, "score": 870},
      {"time": 855.51, "score": 860},
      {"time": 863.43, "score": 850},
      {"time": 871.48, "score": 840},
      {"time": 879.65, "score": 830},
      {"time": 887.95, "score": 820},
      {"time": 896.39, "score": 810},
      {"time": 904.95, "score": 800},
      {"time": 913.65, "score": 790},
      {"time": 922.48, "score": 780},
      {"time": 931.45, "score": 770},
      {"time": 940.56, "score": 760},
      {"time": 949.81, "score": 750},
      {"time": 959.2, "score": 740},
      {"time": 968.74, "score": 730},
      {"time": 978.43, "score": 720},
      {"time": 988.26, "score": 710},
      {"time": 998.24, "score": 700},
      {"time": 1008.38, "score": 690},
      {"time": 1018.68, "score": 680},
      {"time": 1029.13, "score": 670},
      {"time": 1039.74, "score": 660},
      {"time": 1050.52, "score": 650},
      {"time": 1061.46, "score": 640},
      {"time": 1072.58, "score": 630},
      {"time": 1083.87, "score": 620},
      {"time": 1095.33, "score": 610},
      {"time": 1106.97, "score": 600},
      {"time": 1118.78, "score": 590},
      {"time": 1130.79, "score": 580},
      {"time": 1142.97, "score": 570},
      {"time": 1155.35, "score": 560},
      {"time": 1167.92, "score": 550},
      {"time": 1180.69, "score": 540},
      {"time": 1193.66, "score": 530},
      {"time": 1206.84, "score": 520},
      {"time": 1220.22, "score": 510},
      {"time": 1233.81, "score": 500}
    ],
    "road10000": [
      {"time": 1585.13, "score": 1000},
      {"time": 1598.44, "score": 990},
      {"time": 1611.9, "score": 980},
      {"time": 1625.53, "score": 970},
      {"time": 1639.32, "score": 960},
      {"time": 1653.28, "score": 950},
      {"time": 1667.4, "score": 940},
      {"time": 1681.69, "score": 930},
      {"time": 1696.15, "score": 920},
      {"time": 1710.79, "score": 910},
      {"time": 1725.6, "score": 900},
      {"time": 1740.59, "score": 890},
      {"time": 1755.76, "score": 880},
      {"time": 1771.12, "score": 870},
      {"time": 1786.66, "score": 860},
      {"time": 1802.4, "score": 850},
      {"time": 1818.34, "score": 840},
      {"time": 1834.47, "score": 830},
      {"time": 1850.8, "score": 820},
      {"time": 1867.34, "score": 810},
      {"time": 1884.09, "score": 800},
      {"time": 1901.04, "score": 790},
      {"time": 1918.21, "score": 780},
      {"time": 1935.6, "score": 770},
      {"time": 1953.22, "score": 760},
      {"time": 1971.06, "score": 750},
      {"time": 1989.13, "score": 740},
      {"time": 2007.44, "score": 730},
      {"time": 2025.99, "score": 720},
      {"time": 2044.78, "score": 710},
      {"time": 2063.83, "score": 700},
      {"time": 2083.13, "score": 690},
      {"time": 2102.69, "score": 680},
      {"time": 2122.52, "score": 670},
      {"time": 2142.62, "score": 660},
      {"time": 2163, "score": 650},
      {"time": 2183.67, "score": 640},
      {"time": 2204.62, "score": 630},
      {"time": 2225.87, "score": 620},
      {"time": 2247.43, "score": 610},
      {"time": 2269.3, "score": 600},
      {"time": 2291.47, "score": 590},
      {"time": 2313.97, "score": 580},
      {"time": 2336.8, "score": 570},
      {"time": 2359.96, "score": 560},
      {"time": 2383.45, "score": 550},
      {"time": 2407.29, "score": 540},
      {"time": 2431.49, "score": 530},
      {"time": 2456.04, "score": 520},
      {"time": 2480.96, "score": 510},
      {"time": 2506.25, "score": 500}
    ],
    "roadHalfMarathon": [
      {"time": 3414.8, "score": 1000},
      {"time": 3443.11, "score": 990},
      {"time": 3471.8, "score": 980},
      {"time": 3500.88, "score": 970},
      {"time": 3530.35, "score": 960},
      {"time": 3560.21, "score": 950},
      {"time": 3590.47, "score": 940},
      {"time": 3621.14, "score": 930},
      {"time": 3652.22, "score": 920},
      {"time": 3683.72, "score": 910},
      {"time": 3715.65, "score": 900},
      {"time": 3748, "score": 890},
      {"time": 3780.8, "score": 880},
      {"time": 3814.04, "score": 870},
      {"time": 3847.72, "score": 860},
      {"time": 3881.87, "score": 850},
      {"time": 3916.47, "score": 840},
      {"time": 3951.55, "score": 830},
      {"time": 3987.1, "score": 820},
      {"time": 4023.14, "score": 810},
      {"time": 4059.66, "score": 800},
      {"time": 4096.69, "score": 790},
      {"time": 4134.22, "score": 780},
      {"time": 4172.26, "score": 770},
      {"time": 4210.83, "score": 760},
      {"time": 4249.93, "score": 750},
      {"time": 4289.56, "score": 740},
      {"time": 4329.74, "score": 730},
      {"time": 4370.47, "score": 720},
      {"time": 4411.76, "score": 710},
      {"time": 4453.63, "score": 700},
      {"time": 4496.07, "score": 690},
      {"time": 4539.09, "score": 680},
      {"time": 4582.71, "score": 670},
      {"time": 4626.94, "score": 660},
      {"time": 4671.78, "score": 650},
      {"time": 4717.23, "score": 640},
      {"time": 4763.31, "score": 630},
      {"time": 4810.03, "score": 620},
      {"time": 4857.4, "score": 610},
      {"time": 4905.42, "score": 600},
      {"time": 4954.1, "score": 590},
      {"time": 5003.46, "score": 580},
      {"time": 5053.49, "score": 570},
      {"time": 5104.22, "score": 560},
      {"time": 5155.65, "score": 550},
      {"time": 5207.8, "score": 540},
      {"time": 5260.66, "score": 530},
      {"time": 5314.25, "score": 520},
      {"time": 5368.58, "score": 510},
      {"time": 5423.65, "score": 500}
    ],
    "roadMarathon": [
      {"time": 7144.34, "score": 1000},
      {"time": 7203.67, "score": 990},
      {"time": 7263.81, "score": 980},
      {"time": 7324.76, "score": 970},
      {"time": 7386.54, "score": 960},
      {"time": 7449.15, "score": 950},
      {"time": 7512.6, "score": 940},
      {"time": 7576.9, "score": 930},
      {"time": 7642.05, "score": 920},
      {"time": 7708.06, "score": 910},
      {"time": 7774.95, "score": 900},
      {"time": 7842.71, "score": 890},
      {"time": 7911.36, "score": 880},
      {"time": 7980.91, "score": 870},
      {"time": 8051.36, "score": 860},
      {"time": 8122.72, "score": 850},
      {"time": 8195.01, "score": 840},
      {"time": 8268.23, "score": 830},
      {"time": 8342.39, "score": 820},
      {"time": 8417.5, "score": 810},
      {"time": 8493.57, "score": 800},
      {"time": 8570.6, "score": 790},
      {"time": 8648.6, "score": 780},
      {"time": 8727.6, "score": 770},
      {"time": 8807.59, "score": 760},
      {"time": 8888.58, "score": 750},
      {"time": 8970.59, "score": 740},
      {"time": 9053.62, "score": 730},
      {"time": 9137.68, "score": 720},
      {"time": 9222.79, "score": 710},
      {"time": 9308.95, "score": 700},
      {"time": 9396.17, "score": 690},
      {"time": 9484.47, "score": 680},
      {"time": 9573.85, "score": 670},
      {"time": 9664.32, "score": 660},
      {"time": 9755.89, "score": 650},
      {"time": 9848.57, "score": 640},
      {"time": 9942.38, "score": 630},
      {"time": 10037.31, "score": 620},
      {"time": 10133.39, "score": 610},
      {"time": 10230.61, "score": 600},
      {"time": 10329, "score": 590},
      {"time": 10428.56, "score": 580},
      {"time": 10529.29, "score": 570},
      {"time": 10631.22, "score": 560},
      {"time": 10734.34, "score": 550},
      {"time": 10838.67, "score": 540},
      {"time": 10944.21, "score": 530},
      {"time": 11050.98, "score": 520},
      {"time": 11158.98, "score": 510},
      {"time": 11268.22, "score": 500}
    ]
  },
  "women": {
    "track5000": [
      {"time": 840.8, "score": 1000},
      {"time": 848.06, "score": 990},
      {"time": 855.43, "score": 980},
      {"time": 862.91, "score": 970},
      {"time": 870.5, "score": 960},
      {"time": 878.21, "score": 950},
      {"time": 886.03, "score": 940},
      {"time": 893.96, "score": 930},
      {"time": 902.01, "score": 920},
      {"time": 910.18, "score": 910},
      {"time": 918.47, "score": 900},
      {"time": 926.88, "score": 890},
      {"time": 935.41, "score": 880},
      {"time": 944.06, "score": 870},
      {"time": 952.84, "score": 860},
      {"time": 961.75, "score": 850},
      {"time": 970.78, "score": 840},
      {"time": 979.94, "score": 830},
      {"time": 989.23, "score": 820},
      {"time": 998.66, "score": 810},
      {"time": 1008.22, "score": 800},
      {"time": 1017.91, "score": 790},
      {"time": 1027.75, "score": 780},
      {"time": 1037.72, "score": 770},
      {"time": 1047.83, "score": 760},
      {"time": 1058.09, "score": 750},
      {"time": 1068.49, "score": 740},
      {"time": 1079.03, "score": 730},
      {"time": 1089.73, "score": 720},
      {"time": 1100.58, "score": 710},
      {"time": 1111.57, "score": 700},
      {"time": 1122.73, "score": 690},
      {"time": 1134.04, "score": 680},
      {"time": 1145.51, "score": 670},
      {"time": 1157.14, "score": 660},
      {"time": 1168.94, "score": 650},
      {"time": 1180.9, "score": 640},
      {"time": 1193.04, "score": 630},
      {"time": 1205.35, "score": 620},
      {"time": 1217.83, "score": 610},
      {"time": 1230.49, "score": 600},
      {"time": 1243.33, "score": 590},
      {"time": 1256.36, "score": 580},
      {"time": 1269.57, "score": 570},
      {"time": 1282.97, "score": 560},
      {"time": 1296.57, "score": 550},
      {"time": 1310.36, "score": 540},
      {"time": 1324.35, "score": 530},
      {"time": 1338.54, "score": 520},
      {"time": 1352.94, "score": 510},
      {"time": 1367.55, "score": 500}
    ],
    "road10000": [
      {"time": 1755.79, "score": 1000},
      {"time": 1770.72, "score": 990},
      {"time": 1785.86, "score": 980},
      {"time": 1801.2, "score": 970},
      {"time": 1816.75, "score": 960},
      {"time": 1832.51, "score": 950},
      {"time": 1848.48, "score": 940},
      {"time": 1864.67, "score": 930},
      {"time": 1881.07, "score": 920},
      {"time": 1897.7, "score": 910},
      {"time": 1914.54, "score": 900},
      {"time": 1931.61, "score": 890},
      {"time": 1948.91, "score": 880},
      {"time": 1966.44, "score": 870},
      {"time": 1984.2, "score": 860},
      {"time": 2002.2, "score": 850},
      {"time": 2020.45, "score": 840},
      {"time": 2038.93, "score": 830},
      {"time": 2057.67, "score": 820},
      {"time": 2076.66, "score": 810},
      {"time": 2095.9, "score": 800},
      {"time": 2115.4, "score": 790},
      {"time": 2135.16, "score": 780},
      {"time": 2155.19, "score": 770},
      {"time": 2175.49, "score": 760},
      {"time": 2196.06, "score": 750},
      {"time": 2216.9, "score": 740},
      {"time": 2238.03, "score": 730},
      {"time": 2259.44, "score": 720},
      {"time": 2281.14, "score": 710},
      {"time": 2303.13, "score": 700},
      {"time": 2325.41, "score": 690},
      {"time": 2348, "score": 680},
      {"time": 2370.89, "score": 670},
      {"time": 2394.08, "score": 660},
      {"time": 2417.59, "score": 650},
      {"time": 2441.41, "score": 640},
      {"time": 2465.55, "score": 630},
      {"time": 2490.02, "score": 620},
      {"time": 2514.81, "score": 610},
      {"time": 2539.94, "score": 600},
      {"time": 2565.4, "score": 590},
      {"time": 2591.21, "score": 580},
      {"time": 2617.36, "score": 570},
      {"time": 2643.87, "score": 560},
      {"time": 2670.73, "score": 550},
      {"time": 2697.95, "score": 540},
      {"time": 2725.54, "score": 530},
      {"time": 2753.5, "score": 520},
      {"time": 2781.84, "score": 510},
      {"time": 2810.56, "score": 500}
    ],
    "roadHalfMarathon": [
      {"time": 3771.04, "score": 1000},
      {"time": 3802.8, "score": 990},
      {"time": 3834.99, "score": 980},
      {"time": 3867.6, "score": 970},
      {"time": 3900.65, "score": 960},
      {"time": 3934.14, "score": 950},
      {"time": 3968.07, "score": 940},
      {"time": 4002.45, "score": 930},
      {"time": 4037.28, "score": 920},
      {"time": 4072.57, "score": 910},
      {"time": 4108.33, "score": 900},
      {"time": 4144.55, "score": 890},
      {"time": 4181.26, "score": 880},
      {"time": 4218.44, "score": 870},
      {"time": 4256.12, "score": 860},
      {"time": 4294.28, "score": 850},
      {"time": 4332.95, "score": 840},
      {"time": 4372.13, "score": 830},
      {"time": 4411.82, "score": 820},
      {"time": 4452.03, "score": 810},
      {"time": 4492.78, "score": 800},
      {"time": 4534.06, "score": 790},
      {"time": 4575.89, "score": 780},
      {"time": 4618.27, "score": 770},
      {"time": 4661.22, "score": 760},
      {"time": 4704.73, "score": 750},
      {"time": 4748.82, "score": 740},
      {"time": 4793.48, "score": 730},
      {"time": 4838.74, "score": 720},
      {"time": 4884.6, "score": 710},
      {"time": 4931.07, "score": 700},
      {"time": 4978.14, "score": 690},
      {"time": 5025.84, "score": 680},
      {"time": 5074.17, "score": 670},
      {"time": 5123.14, "score": 660},
      {"time": 5172.75, "score": 650},
      {"time": 5223.02, "score": 640},
      {"time": 5273.94, "score": 630},
      {"time": 5325.53, "score": 620},
      {"time": 5377.8, "score": 610},
      {"time": 5430.75, "score": 600},
      {"time": 5484.38, "score": 590},
      {"time": 5538.72, "score": 580},
      {"time": 5593.76, "score": 570},
      {"time": 5649.51, "score": 560},
      {"time": 5705.99, "score": 550},
      {"time": 5763.19, "score": 540},
      {"time": 5821.14, "score": 530},
      {"time": 5879.83, "score": 520},
      {"time": 5939.28, "score": 510},
      {"time": 5999.48, "score": 500}
    ],
    "roadMarathon": [
      {"time": 7911.63, "score": 1000},
      {"time": 7978.07, "score": 990},
      {"time": 8045.39, "score": 980},
      {"time": 8113.62, "score": 970},
      {"time": 8182.73, "score": 960},
      {"time": 8252.77, "score": 950},
      {"time": 8323.72, "score": 940},
      {"time": 8395.6, "score": 930},
      {"time": 8468.43, "score": 920},
      {"time": 8542.2, "score": 910},
      {"time": 8616.94, "score": 900},
      {"time": 8692.64, "score": 890},
      {"time": 8769.33, "score": 880},
      {"time": 8847.01, "score": 870},
      {"time": 8925.69, "score": 860},
      {"time": 9005.38, "score": 850},
      {"time": 9086.09, "score": 840},
      {"time": 9167.84, "score": 830},
      {"time": 9250.63, "score": 820},
      {"time": 9334.47, "score": 810},
      {"time": 9419.38, "score": 800},
      {"time": 9505.37, "score": 790},
      {"time": 9592.45, "score": 780},
      {"time": 9680.62, "score": 770},
      {"time": 9769.9, "score": 760},
      {"time": 9860.29, "score": 750},
      {"time": 9951.81, "score": 740},
      {"time": 10044.47, "score": 730},
      {"time": 10138.27, "score": 720},
      {"time": 10233.23, "score": 710},
      {"time": 10329.35, "score": 700},
      {"time": 10426.65, "score": 690},
      {"time": 10525.14, "score": 680},
      {"time": 10624.81, "score": 670},
      {"time": 10725.69, "score": 660},
      {"time": 10827.79, "score": 650},
      {"time": 10931.11, "score": 640},
      {"time": 11035.66, "score": 630},
      {"time": 11141.46, "score": 620},
      {"time": 11248.51, "score": 610},
      {"time": 11356.83, "score": 600},
      {"time": 11466.43, "score": 590},
      {"time": 11577.32, "score": 580},
      {"time": 11689.5, "score": 570},
      {"time": 11803, "score": 560},
      {"time": 11917.83, "score": 550},
      {"time": 12033.99, "score": 540},
      {"time": 12151.5, "score": 530},
      {"time": 12270.37, "score": 520},
      {"time": 12390.61, "score": 510},
      {"time": 12512.24, "score": 500}
    ]
  }
};

// Function to calculate IAAF points for a result
export const calculateIAAFPoints = (
  distance: string, 
  hours: number, 
  minutes: number, 
  seconds: number, 
  gender: 'men' | 'women'
): number => {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  // Map the distance to the corresponding key in the scoring table
  const mappedDistance = DISTANCE_MAPPINGS[distance];
  if (!mappedDistance) {
    return 0; // Return 0 if the distance is not recognized
  }
  
  // Get the scoring table for the gender and distance
  const scoringTable = iaafScoringTables[gender][mappedDistance];
  if (!scoringTable) {
    return 0; // Return 0 if the scoring table is not found
  }
  
  // Find the points by comparing the time with the scoring table entries
  // If the time is less than the fastest time in the table, return the highest score
  if (totalSeconds <= scoringTable[0].time) {
    return scoringTable[0].score;
  }
  
  // If the time is greater than the slowest time in the table, return 0 or interpolate below minimum
  const lastIndex = scoringTable.length - 1;
  if (totalSeconds >= scoringTable[lastIndex].time) {
    // For times slower than the slowest in the table, calculate points below 500
    // using the same rate of decline as between the last two entries in the table
    const secondLastIndex = lastIndex - 1;
    const timeDiff = scoringTable[lastIndex].time - scoringTable[secondLastIndex].time;
    const scoreDiff = scoringTable[secondLastIndex].score - scoringTable[lastIndex].score;
    const pointsPerSecond = scoreDiff / timeDiff;
    
    const secondsOver = totalSeconds - scoringTable[lastIndex].time;
    const pointsBelow500 = Math.max(0, scoringTable[lastIndex].score - (secondsOver * pointsPerSecond));
    
    return Math.floor(pointsBelow500); // Round down to be conservative
  }
  
  // Find the two entries that bracket the time and interpolate
  for (let i = 0; i < scoringTable.length - 1; i++) {
    if (totalSeconds >= scoringTable[i].time && totalSeconds < scoringTable[i + 1].time) {
      // Linear interpolation between the two scores
      const lowerTime = scoringTable[i].time;
      const upperTime = scoringTable[i + 1].time;
      const lowerScore = scoringTable[i].score;
      const upperScore = scoringTable[i + 1].score;
      
      // Calculate the interpolated score
      const ratio = (totalSeconds - lowerTime) / (upperTime - lowerTime);
      const interpolatedScore = lowerScore - ratio * (lowerScore - upperScore);
      
      return Math.floor(interpolatedScore); // Round down to be conservative
    }
  }
  
  return 0; // Fallback (should not reach here)
};
