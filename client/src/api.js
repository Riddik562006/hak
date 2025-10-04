const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export async function fetchRequestsForUser(userId) {
  const res = await fetch(`${API_BASE}/api/requests/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function createRequest({ userId, secretType, justification, durationDays }) {
  const res = await fetch(`${API_BASE}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, secretType, justification, durationDays })
  });
  if (!res.ok) throw new Error('Failed to create request');
  return res.json();
}

export async function decisionRequest(id, { status, secretValue }) {
  const res = await fetch(`${API_BASE}/api/requests/${id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, secretValue })
  });
  if (!res.ok) throw new Error('Failed to update request');
  return res.json();
}
