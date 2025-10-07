export type IsoUtcString = string;

export interface ApiSuccessResponse {
  date: IsoUtcString;
}

export interface ApiErrorResponse {
  error: 'InvalidParameters' | 'UpstreamUnavailable' | 'InternalError';
  message: string;
}


