export function getAuthCallbackUrl(path: string = "/auth/callback"): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl}${path}`;
}

export function getOAuthRedirectTo(): string {
  return getAuthCallbackUrl("/auth/callback");
}
