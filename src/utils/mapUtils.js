export function getFirstAndLastGuids (guidsArray, numTiles) {
  const firstGuids = guidsArray.map((pair) => pair[0]);
  const lastGuids = guidsArray.map((pair) => pair[1]);
  // traverse the firstGuids array and find the first index where the difference between the current firstGuid and the previous lastGuid is greater than numTiles
  // if the guidsArray is empty, the firstAvailableIndex will be 0
  if (firstGuids.length === 0) {
    return [1, numTiles];
  // if there is only one pair in the guidsArray, the firstAvailableIndex will be 0 or lastGuids[0] + 1
  } else if (firstGuids.length === 1) {
    // if numTiles fits before the firstGuid, return [1, numTiles]
    if (firstGuids[0] > numTiles + 1) {
      return [1, numTiles];
    // if numTiles fits after the lastGuid, return [lastGuids[0] + 1, lastGuids[0] + numTiles]
    } else {
      return [lastGuids[0] + 1, lastGuids[0] + numTiles];
    }
  // else the firstGuids array has more than one pair, traverse the array and find the first index where the difference between the current firstGuid and the previous lastGuid is greater than numTiles
  } else {
    // get space between each firstGuid and the previous lastGuid
    // for example
    // given [[1, 15], [16, 99], [100, 179]]
    // return [0, 0, 0]
    const spaces = firstGuids.map((firstGuid, index) => {
      if (index === 0) {
        return firstGuid - 1;
      } else {
        return firstGuid - lastGuids[index - 1] - 1;
      }
    });
    // console.log('spaces', spaces);

    // find the first index where the space is >= than numTiles
    const firstAvailableIndex = spaces.findIndex((space) => space >= numTiles);
    // console.log('firstAvailableIndex', firstAvailableIndex);

    // if -1, add at end of last pair
    if (firstAvailableIndex === -1) {
      return [lastGuids[lastGuids.length - 1] + 1, lastGuids[lastGuids.length - 1] + numTiles];
    // if 0, add at before first pair
    } else if (firstAvailableIndex === 0) {
      return [firstGuids[0] - numTiles, firstGuids[0] - 1];
    // else add at index
    } else {
      return [lastGuids[firstAvailableIndex - 1] + 1, lastGuids[firstAvailableIndex - 1] + numTiles];
    }
  }
}
