export function getActionName (action) {
  return action.type.split('/')[1];
}

export function truncateString (str, length = 20) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}
