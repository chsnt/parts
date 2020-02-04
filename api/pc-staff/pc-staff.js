const Db = require("../db/db-connect.js");
const { sender } = require("../sender.js");
const makeSQL = require("./sql/make-sql-binder");

const moment = require("moment");
moment.locale("ru");

Array.prototype.replacerS = function(params = { data: false, nulls: false }) {
  return this.map(row => {
    for (key in row) {
      if (params.data)
        row[key] =
          moment(row[key], moment.ISO_8601).isValid() &&
          (key.substring(0, 5) === "DATE_" ||
            key.substring(key.length - 5) === "_DATE" ||
            key === "DATEBORN")
            ? moment(row[key]).format("L")
            : row[key];
      if (params.nulls) row[key] = row[key] === null ? "" : row[key];
    }
    return row;
  });
};

class Staff {
  static async get(request, response) {
    let id_company = request.query.id;

    try {
      let data = [];
      let { queryString, bind, optionsObj } = makeSQL.makeSelect(id_company);

      Db.poolDb(queryString, bind, optionsObj)
        .then(res => {
          data = res.rows;

          data = data.replacerS({ nulls: true });
          data = data.replacerS({ data: true });

          // Схлопываем данные сотрудников, данные о сертификатах в отдельное поле в массив
          data = (function reducer(data) {
            let prevRow = {};
            prevRow.ID = 0;

            let bank = [];
            let lump = {};

            const mkTempl = row => {
              row.QUAL_CERTS =
                row.ID_QUAL_CERT !== ""
                  ? (row.QUAL_CERTS = [
                      {
                        ID_QUAL_CERT: row.ID_QUAL_CERT,
                        DIRECTION: row.DIRECTION,
                        NUM: row.NUM,
                        DATE_START: row.DATE_START,
                        DATE_END: row.DATE_END
                      }
                    ])
                  : (row.QUAL_CERTS = []);

              delete row.ID_QUAL_CERT;
              delete row.DIRECTION;
              delete row.NUM;
              delete row.DATE_START;
              delete row.DATE_END;

              return row;
            };

            try {
              for (let row of data) {
                if (row.ID === prevRow.ID) {
                  lump.QUAL_CERTS.push({
                    ID_QUAL_CERT: row.ID_QUAL_CERT,
                    //ID_STAFF: row.ID_STAFF,
                    DIRECTION: row.DIRECTION,
                    NUM: row.NUM,
                    DATE_START: row.DATE_START,
                    DATE_END: row.DATE_END
                  });
                  prevRow = lump;
                } else {
                  bank.push(lump);
                  lump = mkTempl(row);
                  prevRow = lump;
                }
              }
            } catch (err) {
              console.dir(err);
            }

            bank.splice(0, 1);

            bank.push(lump);
            return bank;
          })(data);

          // Берем только неповторяющиеся элементы массива
          const unique = arr => {
            let result = [];
            for (let str of arr) {
              if (!result.includes(str)) {
                result.push(str);
              }
            }
            return result;
          };

          // Строки в массивы
          data = data.map(emp => {
            // let processed = emp
            emp.POSITIONS = emp.POSITIONS
              ? unique(emp.POSITIONS.split(","))
              : [];
            emp.QUAL_CERTS_LIST_DIR = emp.QUAL_CERTS_LIST_DIR
              ? unique(emp.QUAL_CERTS_LIST_DIR.split(","))
              : [];
            emp.QUAL_CERTS_LIST_DIR_SHORT = emp.QUAL_CERTS_LIST_DIR_SHORT
              ? unique(emp.QUAL_CERTS_LIST_DIR_SHORT.split(","))
              : [];
            emp.POSITION_WEIGHT_DECOMPOSE = emp.POSITION_WEIGHT_DECOMPOSE
              ? unique(emp.POSITION_WEIGHT_DECOMPOSE.split(","))
              : [];

            emp.POSITION_WEIGHT_DECOMPOSE = emp.POSITION_WEIGHT_DECOMPOSE.map(
              e => parseInt(e)
            );

            return emp;
          });

          sender(response, data);
        })
        .catch(err => {
          console.log(err);
          throw new Error(err);
        });
    } catch (err) {
      console.dir(err);
      return err;
    }
  }

  static async insert(data, response) {
    try {
      let { queryString, bind, optionsObj } = makeSQL.makeInsert(data);
      let res = await Db.poolDb(queryString, bind, optionsObj);
      let result = res.outBinds
        ? { response: "ok", ...res.outBinds }
        : { response: "error", comment: JSON.stringify(res) };
      sender(response, result);
    } catch (err) {
      sender(response, { response: "error", comment: err.message });
    }
  }

  static async update(data) {
    let { queryString, bind, optionsObj } = makeSQL.makeUpdate(data);
    let res = await Db.poolDb(queryString, bind, optionsObj);
    console.log(res);
  }

  static async delete(data) {
    let { queryString, bind, optionsObj } = makeSQL.makeDelete(data);
    let res = await Db.poolDb(queryString, bind, optionsObj);
    console.log(res);
  }
  //getPositionWeight
  static async getPositionWeight(request, response) {
    let { queryString, bind, optionsObj } = makeSQL.makeSelectPositionWeight();
    let result = await Db.poolDb(queryString, bind, optionsObj);
    sender(response, result.rows);
  }
}

module.exports = Staff;
//PcAttributes.insert()
