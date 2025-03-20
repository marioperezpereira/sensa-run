
import { CoefficientTable } from './types';

/**
 * World Athletics (formerly IAAF) scoring tables coefficients
 * for the 2022+ scoring formula
 * 
 * Formula: points = a*t² + b*t + c
 * Where:
 * - t is the time in seconds
 * - a, b, c are the coefficients for the specific event
 */
export const waCoefficients: CoefficientTable = {
  men: {
    "track5000": {
      a: 0.002777997945427213,
      b: -8.000608112196687,
      c: 5760.418712362531
    },
    "road10000": {
      a: 5.243835511893474e-4,
      b: -3.302659028227424,
      c: 5200.274036400777
    },
    "roadHalfMarathon": {
      a: 9.469710951061014e-5,
      b: -1.3521892901331114,
      c: 4827.020676429092
    },
    "roadMarathon": {
      a: 2.0101186255287035e-5,
      b: -0.6150659606552438,
      c: 4705.042285787989
    }
  },
  women: {
    "track5000": {
      a: 8.079992470730324e-4,
      b: -3.3935897885437782,
      c: 3563.2616780022654
    },
    "road10000": {
      a: 1.7119892280619345e-4,
      b: -1.540623663798911,
      c: 3466.0215817096905
    },
    "roadHalfMarathon": {
      a: 2.5960366893742386e-5,
      b: -0.5606107770831628,
      c: 3026.587224518895
    },
    "roadMarathon": {
      a: 5.389966906974475e-6,
      b: -0.25224574933865895,
      c: 2951.2162982728405
    }
  }
};
