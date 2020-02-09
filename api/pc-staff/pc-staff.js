const Db = require("../db/db-connect.js");
const { sender } = require("../sender.js");
const makeSQL = require("./sql/make-sql-binder");

const moment = require("moment");
moment.locale("ru");

class Staff {
  static async get(request, response) {
    let id_company = request.query.id;

    try {
      let data = [];
      let { queryString, bind, optionsObj } = makeSQL.makeSelect(id_company);

      Db.poolDb(queryString, bind, optionsObj)
        .then(res => {
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
