/**
 * experienceService.js
 * Handles all API calls for Candidate Work Experience feature.
 *
 * Env var: VITE_EXPERIENCE_API_URL
 * Example: https://xxxxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/prod
 */

import { getAuthHeaders } from './authHeaders';

const BASE = import.meta.env.VITE_EXPERIENCE_API_URL || '';

async function request(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    mode: 'cors',
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from API: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }
  return data;
}

// ─── Candidate APIs ───────────────────────────────────────────────────────────

/**
 * Submit a new work experience (candidate).
 * proofImages: array of base64 data-URIs or already-uploaded S3 URLs (max 5)
 */
export async function createExperience(payload) {
  return request('/candidate/experience', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get all experiences for the logged-in candidate (all statuses).
 */
export async function getMyCandidateExperiences() {
  const data = await request('/candidate/experience');
  return data?.data ?? [];
}

// ─── Admin APIs ────────────────────────────────────────────────────────────────

/**
 * Get all experiences (admin), optionally filtered by status.
 * @param {'all'|'PENDING'|'APPROVED'|'REJECTED'} status
 */
export async function getAllExperiences(status = 'all') {
  const qs = status && status !== 'all' ? `?status=${status}` : '';
  const data = await request(`/admin/experiences${qs}`);
  return data?.data ?? [];
}

/**
 * Get a single experience by ID (admin).
 */
export async function getExperienceById(experienceId) {
  const data = await request(`/admin/experiences/${experienceId}`);
  return data?.data ?? null;
}

/**
 * Approve an experience (admin).
 */
export async function approveExperience(experienceId) {
  return request(`/admin/experiences/${experienceId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
}

/**
 * Reject an experience (admin).
 * @param {string} experienceId
 * @param {string} rejectedReason
 */
export async function rejectExperience(experienceId, rejectedReason = '') {
  return request(`/admin/experiences/${experienceId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ rejectedReason }),
  });
}

/**
 * Get APPROVED experiences for a specific candidate (employer view).
 */
export async function getCandidateApprovedExperiences(candidateId) {
  const data = await request(`/employer/candidate/${candidateId}/experience`);
  return data?.data ?? [];
}

export default {
  createExperience,
  getMyCandidateExperiences,
  getAllExperiences,
  getExperienceById,
  approveExperience,
  rejectExperience,
  getCandidateApprovedExperiences,
};
