export function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pluralize (count, singular) {
  return count === 1 ? `${count} ${singular}` : `${count} ${singular}s`;
}

export function timeAgo (date, currentTime = new Date()) {
  if (currentTime < date) throw new Error('timeAgo date must be in the past');

  const seconds = Math.floor((currentTime - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (seconds < 60) {
    return pluralize(seconds, 'second');
  } else if (minutes < 60) {
    return pluralize(minutes, 'minute');
  } else if (hours < 24) {
    return pluralize(hours, 'hour');
  } else if (days < 30) {
    return pluralize(days, 'day');
  } else if (months < 12) {
    return pluralize(months, 'month');
  } else {
    return pluralize(years, 'year');
  }
}
