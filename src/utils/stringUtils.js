export function getActionName (action) {
  console.log(action.type.split('/')[1]);
  return action.type.split('/')[1];
}
