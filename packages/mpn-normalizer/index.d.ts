export type SupportedBrand =
  | 'ABB'
  | 'Siemens'
  | 'Allen-Bradley'
  | 'Schneider Electric'
  | 'Yokogawa'
  | 'Rosemount'
  | 'Bently Nevada'
  | 'Hagglunds'
  | 'EagleBurgmann';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OcrRepairResult {
  token: string;
  repairs: string[];
  matchedFamily: string | null;
  brand: SupportedBrand | string | null;
}

export interface NormalizeOptions {
  brandHint?: string;
}

export interface NormalizedMpnResult {
  original: string;
  canonicalMpn: string;
  compactKey: string;
  catalogSlugCandidate: string;
  brand: SupportedBrand | string | null;
  matchedFamily: string | null;
  revisionOrSeries: string | null;
  ocrRepaired: boolean;
  repairs: string[];
  searchAliases: string[];
  confidence: ConfidenceLevel;
}

export interface ParsedBomLineResult extends NormalizedMpnResult {
  quantity: number;
  uom: 'EA' | 'PCS' | 'SET';
}

export declare const SUPPORTED_BRANDS: readonly SupportedBrand[];

export declare function repairOcrConfusions(
  cleanedUpper: string,
  brandHint?: string | null
): OcrRepairResult;

export declare function classifyOemBrand(
  mpnInput: string,
  explicitBrand?: string
): {
  brand: SupportedBrand | string | null;
  family: string | null;
  confidence: ConfidenceLevel;
};

export declare function normalizeMpn(
  rawInput: string,
  options?: NormalizeOptions
): NormalizedMpnResult;

export declare function parseBomLine(line: string): ParsedBomLineResult | null;
