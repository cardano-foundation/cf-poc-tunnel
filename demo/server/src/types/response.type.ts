interface ResponseData<T> {
  data: T;
  error?: unknown;
  success: boolean;
  statusCode: number;
}

export type { ResponseData };
