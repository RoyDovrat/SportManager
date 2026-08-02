export { apiRequest } from './client'
export type { ApiRequestOptions } from './client'
export { login } from './auth'
export type { AuthResponse, LoginRequest } from './auth'
export { formatApiError } from './formatApiError'
export { formatPublicApiError } from './formatPublicApiError'
export { getHealth } from './health'
export type { HealthResponse } from './health'
export {
  activateActivity,
  createActivity,
  deactivateActivity,
  listActivities,
  updateActivity,
} from './activities'
export type { ActivityRequest, ActivityResponse } from './activities'
export {
  createActivityPricing,
  listActivityPricingBySeason,
  updateActivityPricing,
} from './activityPricing'
export type {
  ActivityPricingRequest,
  ActivityPricingResponse,
  ActivityPricingUpdateRequest,
} from './activityPricing'
export {
  createClothingPricing,
  getClothingPricingBySeason,
  listClothingPricing,
  updateClothingPricing,
} from './clothingPricing'
export type {
  ClothingPricingRequest,
  ClothingPricingResponse,
  ClothingPricingUpdateRequest,
} from './clothingPricing'
export {
  activateSeason,
  createSeason,
  deactivateSeason,
  listSeasons,
  updateSeason,
} from './seasons'
export type { SeasonRequest, SeasonResponse } from './seasons'
export {
  getActiveSeason,
  getFootballCatalog,
  listActiveActivities,
} from './publicCatalog'
export type { FootballCatalogResponse } from './publicCatalog'
export { createRegistration } from './registrations'
export type { RegistrationRequest, RegistrationResponse } from './registrations'
export { ApiError, isErrorResponse } from './types'
export type { ErrorResponse } from './types'
