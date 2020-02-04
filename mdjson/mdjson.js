/**
 * - Params:
 * Object with parameters:
 *   - arrMaxLvl (vals: true/false) -> Scale arrays {"KEY" : []} -> []
 *   - keepLastKeys  (vals: number) -> Count of additional keys in endless object
 *
 * Exapmle (default):
 *   {
 *     arrMaxLvl: false,
 *     keepLastKeys: 0
 *   }
 */

const mdJSON = function(data, params) {
  // Default pamameters (keys of parametrs)
  const paramsDefault = {
    arrMaxLvl: false,
    keepLastKeys: 0 // Number of additional fields that we kepp in the returning object
  };

  params = Object.assign(paramsDefault, params);

  // Field names
  let arrFields = [];
  for (field in data[0]) {
    arrFields.push(field);
  }

  let dim = arrFields.length - 1;

  getObj.arrFields = arrFields;
  getObj.dim = dim;
  getObj.params = params;

  let obj = getObj(data);
  console.dir(obj);

  return obj;
};

const getObj = function(objIn) {
  let objOut = {};
  let prevVal;
  let curVal;
  // Count of row elements
  let level = -1;

  let arrFields = getObj.arrFields;
  let dim = getObj.dim;
  let params = getObj.params;

  let keepLastKeys = params.keepLastKeys;

  for (field in objIn[0]) {
    level++;
  }

  if (level === 0) {
    objOut = [];
  }

  for (let i = 0; i < objIn.length; i++) {
    curVal = objIn[i][arrFields[dim - level]];

    if (curVal == null) {
      objOut = [];
    } else if (level === 0 + keepLastKeys) {
      if (keepLastKeys) {
        if (!Object.keys(objOut).length) objOut = [];
        objOut.push(objIn[i]);
      } else {
        objOut.push(curVal);
      }
    } else if (curVal !== prevVal) {
      objSend = objIn
        .filter(row => row[arrFields[dim - level]] === curVal)
        .map(row => {
          let cutRow = {};
          for (field in row) {
            if (field !== arrFields[dim - level]) cutRow[field] = row[field];
          }
          return cutRow;
        });

      returned = getObj(objSend);

      objOut[curVal] = returned;

      if (i === objIn.length - 1) {
        // objIn.length - last field

        let hightLvlArrFlag = params.arrMaxLvl ? true : dim - level > 1;
        if (
          Array.isArray(objOut[curVal]) &&
          objOut[curVal].length == 0 &&
          hightLvlArrFlag
        ) {
          objOut = objToArr(objOut);
        }
      }
    }

    prevVal = curVal;
  }

  console.dir(objOut);
  return objOut;
};

const objToArr = function(obj) {
  let i = 0;
  let vals;

  vals = Object.values(obj);
  let sumVals = vals.reduce((sum = [], cur) => {
    return sum.concat(cur);
  });
  return (ret = sumVals.length ? obj : Object.keys(obj));
};

module.exports.mdJSON = mdJSON;
