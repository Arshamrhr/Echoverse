const API_URL = import.meta.env.VITE_API_URL;

export async function fetchComments(animeId) {
  const res = await fetch(`${API_URL}/animes/${animeId}/comments`);
  if (!res.ok) throw new Error("Failed to load comments");
  return res.json();
}

export async function postComment(animeId, text, accessToken) {
  const res = await fetch(`${API_URL}/animes/${animeId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to post comment");
  }
  return res.json();
}

export async function likeComment(animeId, commentId, accessToken) {
  const res = await fetch(`${API_URL}/animes/${animeId}/comments/${commentId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to like comment");
  }
  return res.json();
}

export async function fetchTopComment(animeId) {
  const res = await fetch(`${API_URL}/animes/${animeId}/comments/top`);
  if (!res.ok) return null;
  const data = await res.json();
  return data; // null if nobody has liked a comment yet
}
