export function getAvatarInitials(displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return "QF";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}
