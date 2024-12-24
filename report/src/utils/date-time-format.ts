import momentTz from "moment-timezone";

export const convertToUserTimezone = ({
  date,
  userTimezone = "Asia/Ulaanbaatar",
  format = "YYYY-MM-DD HH:mm:ss",
}: {
  date: Date;
  userTimezone?: string;
  format?: string;
}) => {
  return momentTz.utc(date).tz(userTimezone).format(format);
};
