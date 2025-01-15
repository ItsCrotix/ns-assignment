export interface TripData {
  idx: number;
  uid: string;
  ctxRecon: string;
  sourceCtxRecon: string;
  plannedDurationInMinutes: number;
  actualDurationInMinutes: number;
  transfers: number;
  status: string;
  messages: any[];
  legs: Leg[];
  checksum: string;
  crowdForecast: string;
  punctuality: number;
  optimal: boolean;
  fareRoute: FareRoute;
  fares: Fare[];
  fareLegs: FareLeg[];
  productFare: ProductFare;
  fareOptions: FareOptions;
  nsiLink: NsiLink;
  type: string;
  shareUrl: ShareUrl;
  realtime: boolean;
  routeId: string;
  registerJourney: RegisterJourney;
  modalityListItems: ModalityListItem[];
  points: number;
}

export interface Leg {
  idx: string;
  name: string;
  travelType: string;
  direction: string;
  partCancelled: boolean;
  cancelled: boolean;
  isOnOrAfterCancelledLeg: boolean;
  changePossible: boolean;
  alternativeTransport: boolean;
  journeyDetailRef: string;
  origin: Station;
  destination: Station;
  product: Product;
  stops: Stop[];
  crowdForecast: string;
  bicycleSpotCount?: number;
  punctuality: number;
  crossPlatformTransfer?: boolean;
  shorterStock: boolean;
  journeyDetail: JourneyDetail;
  reachable: boolean;
  plannedDurationInMinutes: number;
  nesProperties: NesProperties;
  duration: Duration;
  preSteps: any[];
  postSteps: any[];
  transferTimeToNextLeg?: number;
  transferMessages?: TransferMessage[];
}

export interface Station {
  name: string;
  lng: number;
  lat: number;
  countryCode: string;
  uicCode: string;
  stationCode: string;
  type: string;
  plannedTimeZoneOffset: number;
  plannedDateTime: string;
  actualTimeZoneOffset?: number;
  actualDateTime?: string;
  plannedTrack: string;
  actualTrack: string;
  checkinStatus: string;
  notes: any[];
  exitSide?: string; // Only for Destination
}

export interface Product {
  productType: string;
  number: string;
  categoryCode: string;
  shortCategoryName: string;
  longCategoryName: string;
  operatorCode: string;
  operatorName: string;
  operatorAdministrativeCode: number;
  type: string;
  displayName: string;
  nameNesProperties: NesProperties;
  iconNesProperties: IconNesProperties;
  notes: Note[][];
}

export interface NesProperties {
  color: string;
}

export interface IconNesProperties {
  color: string;
  icon: string;
}

export interface Note {
  value: string;
  shortValue: string;
  accessibilityValue: string;
  key: string;
  noteType: string;
  isPresentationRequired: boolean;
  nesProperties: NesProperties;
}

export interface Stop {
  uicCode: string;
  name: string;
  lat: number;
  lng: number;
  countryCode: string;
  notes: any[];
  routeIdx: number;
  plannedDepartureDateTime?: string;
  plannedDepartureTimeZoneOffset?: number;
  actualDepartureDateTime?: string;
  actualDepartureTimeZoneOffset?: number;
  actualDepartureTrack: string;
  plannedDepartureTrack: string;
  plannedArrivalTrack: string;
  actualArrivalTrack: string;
  departureDelayInSeconds?: number;
  cancelled: boolean;
  borderStop: boolean;
  passing: boolean;
  plannedArrivalDateTime?: string;
  plannedArrivalTimeZoneOffset?: number;
  actualArrivalDateTime?: string;
  actualArrivalTimeZoneOffset?: number;
  arrivalDelayInSeconds?: number;
}

export interface JourneyDetail {
  notes: any[];
  productNumbers: string[];
  stops: JourneyStop[];
  source: string;
  allowCrowdReporting: boolean;
}

export interface JourneyStop {
  plannedStock?: Stock;
  actualStock?: Stock;
  stop: StopDetails;
  arrivals: Arrival[];
  nextStopId: string[];
  previousStopId: string[];
  destination?: string;
  platformFeatures?: any[];
  id: string;
  coachCrowdForecast?: any[];
  departures: Departure[];
  status: string;
}

export interface Stock {
  numberOfParts: number;
  hasSignificantChange: boolean;
  numberOfSeats: number;
  trainParts: TrainPart[];
  trainType: string;
}

export interface TrainPart {
  facilities: string[];
  image: Image;
  stockIdentifier: string;
}

export interface Image {
  uri: string;
}

export interface StopDetails {
  name: string;
  lng: number;
  uicCode: string;
  lat: number;
  countryCode: string;
}

export interface Arrival {
  actualTime: string;
  product: ProductDetails;
  crowdForecast: string;
  origin: StationDetails;
  destination: StationDetails;
  plannedTime: string;
  delayInSeconds: number;
  plannedTrack: string;
  cancelled: boolean;
  actualTrack: string;
  stockIdentifiers: string[];
  punctuality?: number;
}

export interface ProductDetails {
  number: string;
  shortCategoryName: string;
  longCategoryName: string;
  categoryCode: string;
  operatorCode: string;
  type: string;
  operatorName: string;
}

export interface StationDetails {
  name: string;
  lng: number;
  uicCode: string;
  lat: number;
  countryCode: string;
}

export interface Departure {
  actualTime: string;
  product: ProductDetails;
  crowdForecast: string;
  origin: StationDetails;
  destination: StationDetails;
  plannedTime: string;
  delayInSeconds: number;
  plannedTrack: string;
  cancelled: boolean;
  actualTrack: string;
  stockIdentifiers: string[];
}

export interface Duration {
  value: string;
  accessibilityValue: string;
  nesProperties: NesProperties;
}

export interface TransferMessage {
  message: string;
  accessibilityMessage: string;
  type: string;
  messageNesProperties: MessageNesProperties;
}

export interface MessageNesProperties {
  color: string;
  type: string;
}

export interface FareRoute {
  routeId: string;
  origin: FareStation;
  destination: FareStation;
}

export interface FareStation {
  varCode: number;
  name: string;
}

export interface Fare {
  priceInCents: number;
  product: string;
  travelClass: string;
  discountType: string;
}

export interface FareLeg {
  origin: FareStationDetails;
  destination: FareStationDetails;
  operator: string;
  productTypes: string[];
  fares: FareDetails[];
}

export interface FareStationDetails {
  name: string;
  lng: number;
  lat: number;
  countryCode: string;
  uicCode: string;
  stationCode: string;
  type: string;
}

export interface FareDetails {
  priceInCents: number;
  priceInCentsExcludingSupplement: number;
  supplementInCents: number;
  buyableTicketSupplementPriceInCents: number;
  product: string;
  travelClass: string;
  discountType: string;
}

export interface ProductFare {
  priceInCents: number;
  priceInCentsExcludingSupplement: number;
  buyableTicketPriceInCents: number;
  buyableTicketPriceInCentsExcludingSupplement: number;
  product: string;
  travelClass: string;
  discountType: string;
}

export interface FareOptions {
  isInternationalBookable: boolean;
  isInternational: boolean;
  isEticketBuyable: boolean;
  isPossibleWithOvChipkaart: boolean;
  isTotalPriceUnknown: boolean;
}

export interface NsiLink {
  url: string;
  showInternationalBanner: boolean;
}

export interface ShareUrl {
  uri: string;
}

export interface RegisterJourney {
  url: string;
  searchUrl: string;
  status: string;
  bicycleReservationRequired: boolean;
}

export interface ModalityListItem {
  name: string;
  nameNesProperties: NesProperties;
  iconNesProperties: IconNesProperties;
  actualTrack: string;
  accessibilityName: string;
}
