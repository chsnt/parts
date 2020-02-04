const helpString = `
Object with parameters:
  - arrMaxLvl (vals: true/false) -> Scale arrays {"KEY" : []} -> []
  - keepLastKeys  (vals: number) -> Count of additional keys in endless object

Exapmle (default):
  {
    arrMaxLvl: false,    
    keepLastKeys: 0      
  } 
`

const mdJSON = function (data, params){

    //console.log(helpString)
    if( [...arguments].indexOf('help') > -1 ) {
        return  helpString
    }


    // Default pamameters (keys of parametrs)
    const paramsDefault = {
          arrMaxLvl : false,    
          keepLastKeys: 0       // Количество дополнительных полей, которое мы оставляем в конечном объекте
    }
    
    params = Object.assign(paramsDefault, params)

    // Имена полей
    var arrFields = [] //= Object.keys(data[0])

    for(field in data[0]){
        arrFields.push(field)
    }

    var dim = arrFields.length - 1

    getObj.arrFields = arrFields
    getObj.dim = dim
    getObj.params = params


    let obj = getObj( data )
    //console.dir(obj)

    return obj    

}

const getObj = function (objIn) {
        
    var objOut = {}
    var prevVal;
    var curVal;
    // Кол-во элементов в строке (level)
    var level = -1

    var arrFields = getObj.arrFields
    var dim = getObj.dim
    var params = getObj.params

    var keepLastKeys = params.keepLastKeys


    for (field in objIn[0]){ level++ }
    //level = Object.keys(objIn[0]).length--
    if (level === 0 ) { objOut = [] }

    for(var i = 0; i < objIn.length; i++){

        curVal = objIn[i][arrFields[dim - level]]      

        if (curVal == null ) {
            objOut = []
        } else if ( level === (0 + keepLastKeys) ) {
            if (keepLastKeys) {                
                if (!Object.keys(objOut).length) objOut = []
                objOut.push(objIn[i])
            } else {
                objOut.push(curVal)
            }
            
        } else if( curVal !== prevVal) {

           // var keepLastKeys = params.keepLastKeys

            objSend = objIn
            .filter( row => row[arrFields[dim - level]]===curVal)
            .map( row => {
                var cutRow = {}
                for (field in row){
                    if ( field !== (arrFields[dim - level]) ) cutRow[field] = row[field]                  
                }
                return cutRow
            })   

            returned = getObj(objSend)

            objOut[curVal] = returned 

            if ( i === (objIn.length-1) ) {  // objIn.length - последняя строка рассматриваемого объекта
                
                var hightLvlArrFlag = (params.arrMaxLvl)? true : ((dim - level) > 1)   // 
                if ( Array.isArray(objOut[curVal]) && objOut[curVal].length == 0 && hightLvlArrFlag ){
                    //console.log(dim-level)                    
                    objOut = objToArr(objOut);
                }
            }

        }
        
        prevVal = curVal
    }
    
    //console.dir(objOut)
    return objOut
}


const objToArr = function (obj) {

    var i = 0

    // Переберем все строки и поищем значения неравные []
    // Если есть хоть одно, то выходим ни с чем

    var vals;

    vals = Object.values(obj)
    var sumVals = vals.reduce( (sum=[], cur) => {
        return sum.concat(cur)
    })
    return ret = (sumVals.length)? obj : Object.keys(obj);

}


module.exports.mdJSON = mdJSON