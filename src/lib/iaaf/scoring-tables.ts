
import { ScoringTable } from './types';
import { iaafFullScoringData } from './scoring-data';

/**
 * Export the full IAAF scoring table data for all events and distances
 * Source: https://github.com/jchen1/iaaf-scoring-tables/blob/master/iaaf-2025.json
 */
export const iaafScoringTables: ScoringTable = iaafFullScoringData;
