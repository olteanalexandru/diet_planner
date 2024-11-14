import { ApiResponse, ApiError } from '../types';
import { ERROR_MESSAGES } from './constants';



interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const { params, ...fetchOptions } = options;
    let url = endpoint;

    // Add query parameters if they exist
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
      url += `?${searchParams.toString()}`;
    }

    // Set default headers
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format');
    }

    const data = await response.json();

    // Handle API error responses
    if (!response.ok) {
      const error: ApiError = {
        message: data.message || ERROR_MESSAGES.SERVER_ERROR,
        code: data.code || 'UNKNOWN_ERROR',
        statusCode: response.status,
      };
      throw error;
    }

    return { data, status: response.status };
  } catch (error) {
    if ((error as ApiError).statusCode) {
      const apiError = error as ApiError;
      return {
        error: apiError.message,
        status: apiError.statusCode,
      };
    }

    // Handle network or parsing errors
    return {
      error: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR,
      status: 500,
    };
  }
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return ERROR_MESSAGES.SERVER_ERROR;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error
  );
}

export async function uploadFile(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<{ url: string }>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Return a promise that resolves when the upload is complete
    const uploadPromise = new Promise<ApiResponse<{ url: string }>>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve({ data: response, status: xhr.status });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
    });

    // Start the upload
    xhr.open('POST', uploadUrl);
    xhr.send(formData);

    return await uploadPromise;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Upload failed',
      status: 500,
    };
  }
}

export function parseApiResponse<T>(response: Response): Promise<T> {
  return response.json().then(data => {
    if (!response.ok) {
      throw new Error(data.message || ERROR_MESSAGES.SERVER_ERROR);
    }
    return data;
  });
}

export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError || new Error(ERROR_MESSAGES.SERVER_ERROR);
}
