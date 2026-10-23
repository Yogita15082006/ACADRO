import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAssetUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Determine base backend host (without trailing /api)
  const baseHost = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:8080';

  // If it's already an absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Pure UUID storage ID pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return `${baseHost}/api/v1/resources/download/${trimmed}`;
  }

  // If path contains /resources/download/{uuid}
  const match = trimmed.match(/\/resources\/download\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (match && match[1]) {
    return `${baseHost}/api/v1/resources/download/${match[1]}`;
  }

  // If path starts with /api/
  if (trimmed.startsWith('/api/')) {
    return `${baseHost}${trimmed}`;
  }

  // If path starts with /v1/
  if (trimmed.startsWith('/v1/')) {
    return `${baseHost}/api${trimmed}`;
  }

  return trimmed.startsWith('/') ? `${baseHost}${trimmed}` : `${baseHost}/${trimmed}`;
};
