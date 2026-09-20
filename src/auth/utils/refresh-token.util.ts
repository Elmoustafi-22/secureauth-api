export function parseRefreshToken(refreshToken: string) {
  const [sessionId, refreshSecret] = refreshToken.split('.');

  if (!sessionId || !refreshSecret) {
    return null;
  }

  return {
    sessionId,
    refreshSecret,
  };
}
