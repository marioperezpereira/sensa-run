
/**
 * This file imports and re-exports all IAAF-related constants
 * to maintain backward compatibility after refactoring
 */

// Import from the new modular files
import { indoorEvents, outdoorEvents, order, menOnlyEvents, womenOnlyEvents, isEventValidForGender } from './events';
import { eventNames, markTypes, units } from './eventDefinitions';
import { coefficients } from './coefficients';

// Export everything for backwards compatibility
export {
  // Event-related exports
  indoorEvents,
  outdoorEvents,
  order,
  menOnlyEvents,
  womenOnlyEvents,
  isEventValidForGender,
  
  // Event definitions
  eventNames,
  markTypes,
  units,
  
  // Coefficient data
  coefficients
};
