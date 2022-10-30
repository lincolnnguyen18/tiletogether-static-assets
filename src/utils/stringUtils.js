export function getActionName (action) {
  return action.type.split('/')[1];
}
