const oracledb = require("oracledb");
const config = require("./configDb");
oracledb.autoCommit = true;

class ConnectDB {
  constructor() {
    this.configDb = { ...config };
    this.connection = "";
  }

  static async connect(queryString, bind = [], optionsObj = []) {
    let connection;
    connection = new ConnectDB();
    return new Promise((resolve, reject) => {
      oracledb
        .getConnection(connection.configDb)
        .then(connection => {
          return connection
            .execute(queryString, bind, optionsObj)
            .then(result => {
              resolve(result);
              return connection.close();
            })
            .catch(err => {
              reject(err);
              return connection.close();
            });
        })
        .catch(err => reject(err));
    });
  }
}

module.exports = ConnectDB;
