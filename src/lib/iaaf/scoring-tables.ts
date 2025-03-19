
import { ScoringTable } from './types';
import { menScoringData } from './men-scoring-data';
import { womenScoringData } from './women-scoring-data';

/**
 * Full IAAF scoring table data combining men's and women's data
 * Source: https://github.com/jchen1/iaaf-scoring-tables/blob/master/iaaf-2025.json
 */
export const iaafScoringTables: ScoringTable = {
  men: menScoringData,
  women: womenScoringData
};
