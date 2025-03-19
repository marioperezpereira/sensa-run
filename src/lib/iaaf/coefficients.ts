
/**
 * Coefficients for IAAF scoring tables using the quadratic formula
 * Source: https://github.com/jchen1/iaaf-scoring-tables/blob/master/coefficients-2025.json
 */

export interface IAFCoefficients {
  a: number;
  b: number;
  c: number;
}

export type CoefficientTable = {
  men: {
    [distance: string]: IAFCoefficients;
  };
  women: {
    [distance: string]: IAFCoefficients;
  };
};

// IAAF scoring coefficients
export const iaafCoefficients: CoefficientTable = {
  "men": {
    "track5000": {
      "a": 4.290900e-6,
      "b": -0.01164022,
      "c": 9.37568
    },
    "road10000": {
      "a": 9.03818e-7,
      "b": -0.00549062,
      "c": 9.86523
    },
    "roadHalfMarathon": {
      "a": 1.86959e-7,
      "b": -0.00256929,
      "c": 10.6074
    },
    "roadMarathon": {
      "a": 4.90746e-8,
      "b": -0.00135266,
      "c": 11.1756
    }
  },
  "women": {
    "track5000": {
      "a": 4.76243e-6,
      "b": -0.0110671,
      "c": 8.53331
    },
    "road10000": {
      "a": 1.08218e-6,
      "b": -0.00522221,
      "c": 8.89241
    },
    "roadHalfMarathon": {
      "a": 2.19229e-7,
      "b": -0.00251638,
      "c": 9.87789
    },
    "roadMarathon": {
      "a": 5.56171e-8,
      "b": -0.0013126,
      "c": 10.555
    }
  }
};
