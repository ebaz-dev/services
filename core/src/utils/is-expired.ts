export const IsExpired = (expireDate: Date) => {
  const now = new Date();
  const currentTime = now.getTime();
  const expirationTime = expireDate.getTime();

  const delay = expirationTime - currentTime;

  return {
    delay,
    expired: delay <= 0,
  };
};
