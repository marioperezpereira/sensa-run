
import { CoefficientTable } from './types';

/**
 * Coefficients for World Athletics scoring tables using the quadratic formula
 * Source: https://jeffchen.dev/posts/Calculating-World-Athletics-Coefficients/
 * 
 * The formula used is: score = a*t² + b*t + c
 * Where t is the time in seconds and a, b, c are the coefficients
 */
export const waCoefficients: CoefficientTable = {
  "men": {
    "track5000": {
      "a": 0.00000429090,
      "b": -0.0116402,
      "c": 9.37568
    },
    "road10000": {
      "a": 0.000000903818,
      "b": -0.00549062,
      "c": 9.86523
    },
    "roadHalfMarathon": {
      "a": 0.000000186959,
      "b": -0.00256929,
      "c": 10.6074
    },
    "roadMarathon": {
      "a": 0.0000000490746,
      "b": -0.00135266,
      "c": 11.1756
    }
  },
  "women": {
    "track5000": {
      "a": 0.00000476243,
      "b": -0.0110671,
      "c": 8.53331
    },
    "road10000": {
      "a": 0.00000108218,
      "b": -0.00522221,
      "c": 8.89241
    },
    "roadHalfMarathon": {
      "a": 0.000000219229,
      "b": -0.00251638,
      "c": 9.87789
    },
    "roadMarathon": {
      "a": 0.0000000556171,
      "b": -0.0013126,
      "c": 10.555
    }
  }
};
