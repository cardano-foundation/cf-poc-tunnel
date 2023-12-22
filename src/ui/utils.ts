const isExpired = (date: string): boolean => {
  const dateObj = new Date(date);
  const currentDate = new Date();
  return dateObj < currentDate;
};

export { isExpired };
