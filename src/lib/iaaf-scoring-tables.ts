
/**
 * This file is maintained for backward compatibility.
 * It re-exports everything from the new modular IAAF structure.
 */
export { calculateIAAFPoints, DISTANCE_MAPPINGS, iaafCoefficients } from './iaaf';
export type { IAFScoringEntry, ScoringTable, IAFCoefficients, CoefficientTable } from './iaaf';

// Re-export scoring tables for backward compatibility
import { iaafScoringTables } from './iaaf/scoring-tables';
export { iaafScoringTables };
