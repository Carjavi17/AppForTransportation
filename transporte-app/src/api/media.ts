import { API_URL } from "./config";

export function mediaUrl(path: string | null | undefined): string | null {
  return path ? `${API_URL}${path}` : null;
}