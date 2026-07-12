import axios, { AxiosError } from "axios";
import type { QueryResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Must match `QueryRequest.question`'s `max_length` in
// `backend/app/models/schemas.py` - kept as a constant here (rather than
// fetched from the backend) so the UI can enforce/display the limit
// without an extra round trip.
export const MAX_QUESTION_LENGTH = 1000;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toApiError(err: unknown): ApiError {
  const axiosErr = err as AxiosError<{ detail?: string; message?: string }>;
  if (axiosErr.isAxiosError) {
    const status = axiosErr.response?.status ?? 0;
    const message =
      axiosErr.response?.data?.detail ||
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      `Request failed with status ${status}`;
    return new ApiError(message, status);
  }
  return new ApiError((err as Error)?.message ?? "Unknown error", 0);
}

export async function queryRag(
  sessionId: string,
  question: string,
  topK = 4,
): Promise<QueryResponse> {
  try {
    const res = await api.post<QueryResponse>("/chat/query", {
      session_id: sessionId,
      question,
      top_k: topK,
    });
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await api.get("/health");
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}
