// Given an array of firstGuid, lastGuid pairs and the number of tiles a new tileset will have, return the firstGuid of the new tileset and the lastGuid of the new tileset
// Fit the new tileset in the first available index

// Examples
// Given guidsArray [[1, 15], [16, 99], [100, 179]]
// Given numTiles 100
// Return [180, 279]

// Given guidsArray [[1, 15], [80, 99], [100, 179]]
// Given numTiles 30
// Return [16, 45]

// Given guidsArray [[18, 45], [46, 99], [100, 179]]
// Given numTiles 10
// Return [1, 10]]

// Given guidsArray [[4, 10]]
// Given numTiles 10
// Return [11, 20]

// Given guidsArray []
// Given numTiles 10
// Return [1, 10]

// Given guidsArray [[1, 10], [30, 40]]
// Given numTiles 10
// Return [11, 20]

import { getFirstAndLastGuids } from './mapUtils';
import _ from 'lodash';

describe('getFirstAndLastGuids', () => {
  it('test 1', () => {
    const guidsArray = [[1, 15], [16, 99], [100, 179]];
    const numTiles = 100;
    const result = getFirstAndLastGuids(guidsArray, numTiles);
    expect(result).toEqual([180, 279]);
  });

  it('test 2', () => {
    const guidsArray = [[1, 15], [80, 99], [100, 179]];
    const numTiles = 30;
    const result = getFirstAndLastGuids(guidsArray, numTiles);
    expect(result).toEqual([16, 45]);
  });

  it('test 3', () => {
    const guidsArray = [[18, 45], [46, 99], [100, 179]];
    const numTiles = 10;
    const result = getFirstAndLastGuids(guidsArray, numTiles);
    expect(result).toEqual([8, 17]);
  });

  it('test 4', () => {
    const guidsArray = [[4, 10]];
    const numTiles = 10;
    const result = getFirstAndLastGuids(guidsArray, numTiles);
    expect(result).toEqual([11, 20]);
  });

  it('test 5', () => {
    const guidsArray = [];
    const numTiles = 10;
    const result = getFirstAndLastGuids(guidsArray, numTiles);
    expect(result).toEqual([1, 10]);
  });

  it('test 6', () => {
    const guidsArray = [[1, 10], [30, 40]];
    const numTiles = 10;
    const result = getFirstAndLastGuids(guidsArray, numTiles);
    expect(result).toEqual([11, 20]);
  });

  it('test 7', () => {
    // generate an even number of random numbers then pair them and test the function
    const numPairs = 30;
    const randomNumbers = Array.from({ length: numPairs * 2 }, () => Math.floor(Math.random() * 1000));
    // sort the random numbers
    randomNumbers.sort((a, b) => a - b);
    // pair the random numbers using lodash chunk
    const guidsArray = _.chunk(randomNumbers, 2);
    console.log('guidsArray', guidsArray);
    // generate random tile range
    const randomStartIndex = Math.floor(Math.random() * 1000);
    const randomEndIndex = randomStartIndex + Math.floor(Math.random() * 100);
    const numTiles = randomEndIndex - randomStartIndex;
    console.log('fitting in numTiles', numTiles);
    const result = getFirstAndLastGuids(guidsArray, numTiles);
    console.log('fits at range', result[0], result[1]);
  });
});
