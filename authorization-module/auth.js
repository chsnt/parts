const requestDB = require("./requestDB.js");
const sessionConfig = require("./sessionConfig.js");

const { divTwo } = require("./divTwo.js");
const { mdJSON } = require("./mdjson.js");

const crypto = require("crypto");

const { ARRAY } = require("oracledb");
const { OBJECT } = require("oracledb");
const { STRING } = require("oracledb");

module.exports = {
  getUserID(req, res, data) {
    return new Promise((resolve, reject) => {
      try {
        requestDB(
          "user_id",
          `SELECT
            id
            FROM AUTH_USERS
           WHERE ID =
               (SELECT DISTINCT 
               ID_USER 
               FROM "SYSTEM".AUTH_SESSIONS 
               WHERE ID = '${data.ACCESS_TOKEN}')`,
          {},
          { outFormat: ARRAY }
        )
          .then(result => {
            resolve({
              id: result.id,
              response: JSON.parse(result.response)[0]
            });
          })
          .catch(err => {
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  },

  getUserData(req, res, data) {
    return new Promise((resolve, reject) => {
      try {
        requestDB(
          "userdata",
          `SELECT
            email,
            fullname
            FROM AUTH_USERS
           WHERE ID =
               (SELECT DISTINCT 
               ID_USER 
               FROM "SYSTEM".AUTH_SESSIONS 
               WHERE ID = '${data.ACCESS_TOKEN}')`,
          {},
          { outFormat: OBJECT }
        )
          .then(result => {
            resolve({ id: result.id, response: JSON.parse(result.response) });
          })
          .catch(err => {
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  },

  // Return count of sessions
  checkSession(req, res, access_token) {
    return new Promise((resolve, reject) => {
      requestDB(
        "sessions",
        `SELECT 
          COUNT(*) sessions 
         FROM "SYSTEM".AUTH_SESSIONS 
         WHERE ID = '${access_token}'
         `,
        {},
        { outFormat: ARRAY }
      )
        .then(result => {
          resolve(JSON.parse(result.response)[0]);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  // Make new session
  makeNewSession(req, res, access_token) {
    return new Promise((resolve, reject) => {
      requestDB(
        "access_token",
        `INSERT INTO "SYSTEM".AUTH_SESSIONS 
         ( ID, ID_USER, DATE_BORN, DATE_EXPIRATION )
         VALUES ( :id, (SELECT ID FROM "SYSTEM".AUTH_USERS WHERE login = :lgn ), 
                 SYSTIMESTAMP, SYSTIMESTAMP + interval '${sessionConfig.cookieLifeTime.inMinutes}' minute 
                )`,
        {
          id: { val: access_token, type: STRING, maxSize: 64 * 2 },
          lgn: { val: req.body.login, type: STRING, maxSize: 128 * 2 }
        },
        { autoCommit: true }
      )
        .then(result => {
          try {
            if (result.response) {
              return new Promise((resolve, reject) => {
                this.getAccessesAndUserData(req, res, access_token)
                  .then(result =>
                    resolve({
                      body: this.Template("ok", "token in cookies"),
                      cookie: this.prepareCookieArr(result, access_token)
                    })
                  )
                  .catch(err => reject(err));
              });
            } else {
              reject(`Can't make new session`);
            }
          } catch (err) {
            reject(err);
          }
        })
        .then(result => resolve(result))
        .catch(err => {
          reject(err);
        });
    });
  },

  // Replace current session
  replaceCurSession(req, res, access_token) {
    return new Promise((resolve, reject) => {
      requestDB(
        "access_token",
        `UPDATE "SYSTEM".AUTH_SESSIONS 
         SET ID = :id, 
            DATE_BORN = SYSTIMESTAMP,
            DATE_EXPIRATION = SYSTIMESTAMP + interval '${sessionConfig.cookieLifeTime.inMinutes}' minute 
         WHERE ID_USER = (SELECT ID FROM "SYSTEM".AUTH_USERS WHERE login = :lgn)
        `,
        {
          id: access_token,
          lgn: req.body.login
        }
      )
        .then(result => {
          if (result.response) {
            return new Promise((resolve, reject) => {
              this.getAccessesAndUserData(req, res, access_token)
                .then(result =>
                  resolve({
                    body: this.Template("ok", "token in cookies"),
                    cookie: this.prepareCookieArr(result, access_token)
                  })
                )
                .catch(err => reject(err));
            });
          } else {
            reject(result);
          }
        })
        .then(result => resolve(result))
        .catch(err => {
          reject(err);
        });
    });
  },

  // Update current session
  updateCurSession(req, res, access_token) {
    try {
      return new Promise((resolve, reject) => {
        requestDB(
          "access_token",
          `UPDATE "SYSTEM".AUTH_SESSIONS 
           SET DATE_EXPIRATION = SYSTIMESTAMP + interval '${sessionConfig.cookieLifeTime.inMinutes}' minute 
           WHERE ID = :id
            `,
          { id: access_token },
          { autoCommit: true }
        )
          .then(result => {
            if (result.response) {
              return new Promise((resolve, reject) => {
                this.getAccessesAndUserData(req, res, access_token)
                  .then(result => this.prepareCookieArr(result, access_token))
                  .then(result => {
                    resolve({
                      body: this.Template("ok", "token in cookies"),
                      cookie: result
                    });
                  })
                  .catch(err => {
                    reject(err);
                  });
              });
            } else {
              reject(result);
            }
          })
          .then(result => resolve(result))
          .catch(err => {
            console.log(err);
            reject(err);
          });
      });
    } catch (err) {
      console.log(err);
    }
  },

  // Get token by login
  getTokenByLogin(login) {
    return new Promise((resolve, reject) => {
      requestDB(
        "access_token",
        `SELECT 
          ID
         FROM  "SYSTEM".AUTH_SESSIONS 
         WHERE ID_USER = (SELECT ID FROM "SYSTEM".AUTH_USERS WHERE login = '${login}')
        `,
        {},
        { outFormat: ARRAY }
      )
        .then(result => {
          resolve(JSON.parse(result.response)[0]);
        })
        .catch(err => {
          console.log("Get token by login - error");
          reject(err);
        });
    });
  },

  // Get accesses and user data
  getAccessesAndUserData(req, res, access_token) {
    try {
      return new Promise(async (resolve, reject) => {
        let accesses;
        this.getAccesses(req, res, { access_token: access_token })
          .then(async result => {
            try {
              accesses = { id: "accesses", response: result };
              userdata = await this.getUserData(req, res, {
                ACCESS_TOKEN: access_token
              });

              resolve([accesses, userdata]);
            } catch (err) {
              console.dir(err);
              reject(err);
            }
          })
          .catch(err => {
            console.log("Get accesses - error");
            reject(err);
          });
      });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  },

  prepareCookieArr(data, access_token) {
    let accesses = data.find(e => e.id === "accesses").response;
    let userdata = data.find(e => e.id === "userdata").response;

    let formatUserData = JSON.stringify(userdata);
    let formatAccesses = JSON.stringify(accesses.sova);

    return [
      [
        "access_token",
        access_token,
        {
          path: "/",
          expires: new Date(
            Date.now() + sessionConfig.cookieLifeTime.inMiliseconds
          ), // cookie will be removed after 7 days
          httpOnly: true,
          signed: true
        }
      ],
      [
        "userdata",
        formatUserData,
        {
          path: "/",
          expires: new Date(
            Date.now() + sessionConfig.cookieLifeTime.inMiliseconds
          ), // cookie will be removed after 7 days
          httpOnly: false,
          signed: true
        }
      ],
      [
        "accesses.sova",
        formatAccesses,
        {
          path: "/sova",
          expires: new Date(
            Date.now() + sessionConfig.cookieLifeTime.inMiliseconds
          ), // cookie will be removed after 7 days
          httpOnly: false,
          signed: true
        }
      ]
    ];
  },

  // Get accesses
  getAccesses(req, res, data) {
    return new Promise(async (resolve, reject) => {
      this.tokenRoleWeights(req, res, { ACCESS_TOKEN: data.access_token })
        .then(result => {
          return new Promise(async (resolve, reject) => {
            this.roleNamesAndFuncWeights(req, res, result)
              .then(result => {
                resolve(result);
              })
              .catch(err => {
                // make new session
                console.log("Get accesses - error");
                reject(err);
              });
          });
        })
        .then(data => {
          return new Promise(async (resolve, reject) => {
            try {
              let arrReqFunc = [];

              for (role of data.ROLES) {
                arrReqFunc.push([
                  role.ROLE_NAME,
                  `SELECT funcname FROM AUTH_FUNCTIONS 
                   WHERE weight IN ( ${role.WEIGHT_FUNC.join()} ) AND SYSTEM = '${
                    data.SYSTEM
                  }'`,
                  {},
                  { outFormat: ARRAY }
                ]);
              }

              requestDB(arrReqFunc)
                .then(result => {
                  let obj = [];
                  data.ROLE_FUNC = [];

                  for (role of result) {
                    role.response = JSON.parse(role.response);
                    // Get roles list
                    // Push its into roles array
                    data.ROLE_FUNC.push({
                      ROLE_NAME: role.id,
                      FUNCTIONS: role.response
                    });
                    obj.push({
                      SYSTEM: data.SYSTEM,
                      ROLE_NAME: role.id,
                      ROLE_DESC: data.ROLES.find(r => r.ROLE_NAME === role.id)
                        .ROLE_DESC,
                      FUNCTIONS: role.response
                    });
                  }

                  result = mdJSON(obj, { arrMaxLvl: false, keepLastKeys: 2 });

                  let resultMod = {};
                  for (SYSTEM in result) {
                    let sumFunc = [];
                    resultMod[SYSTEM] = { ROLES: [], FUNCTIONS: [] };
                    if (result.hasOwnProperty(SYSTEM)) {
                      result[SYSTEM].forEach(role => {
                        sumFunc = sumFunc.concat(role.FUNCTIONS);
                        resultMod[SYSTEM].ROLES.push({
                          ROLE_NAME: role.ROLE_NAME,
                          ROLE_DESC: role.ROLE_DESC
                        });
                        return role;
                      });
                    }
                    resultMod[SYSTEM].FUNCTIONS = [...new Set(sumFunc)];
                  }

                  resolve(resultMod);
                })
                .catch(err => reject(err));
            } catch (err) {
              console.log(err);
            }
          });
        })
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  // Users roles list by token
  tokenRoleWeights(req, res, data) {
    data.SYSTEM = "sova";
    return new Promise((resolve, reject) => {
      requestDB(
        "weight_role",
        `SELECT
          weight_role
         FROM AUTH_USERS_AND_THEIR_ROLES
         WHERE ID_USER =
             (SELECT DISTINCT 
             ID_USER 
             FROM "SYSTEM".AUTH_SESSIONS 
             WHERE ID = '${data.ACCESS_TOKEN}')
         AND SYSTEM = '${data.SYSTEM}'
        `,
        {},
        { outFormat: ARRAY }
      )
        .then(result => {
          let weight_role = JSON.parse(result.response)[0];
          if (weight_role) {
            // Get roles list
            resolve(Object.assign(data, { WEIGHT_ROLE: divTwo(weight_role) }));
          } else {
            reject(result);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  // List of roles and function weights
  roleNamesAndFuncWeights(req, res, data) {
    let acceses = {};
    return new Promise((resolve, reject) => {
      requestDB(
        "roles_and_weigth_func",
        `SELECT
            ROLE role_name,
            role_desc,
            weight_func
        FROM AUTH_ROLES 
        WHERE weight_role IN ( ${data.WEIGHT_ROLE.join()} )
        AND SYSTEM = '${data.SYSTEM}'
        `,
        {},
        { outFormat: OBJECT }
      )
        .then(result => {
          result = JSON.parse(result.response);
          if (result) {
            result.forEach(
              role => (role.WEIGHT_FUNC = divTwo(role.WEIGHT_FUNC))
            );
            resolve(Object.assign(data, { ROLES: result }));
          } else {
            reject(result);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  // List of functions by roles
  // Parameters:
  // data - accumulated object
  // role - iterable object
  funcNamesByWeights(req, res, data, role) {
    return new Promise(async (resolve, reject) => {
      try {
        requestDB(
          role.ROLE_NAME,
          `SELECT funcname
           FROM AUTH_FUNCTIONS
           WHERE weight IN ( ${role.WEIGHT_FUNC.join()} )
           AND SYSTEM = '${
             data.SYSTEM
           }'                                                
          `,
          {},
          { outFormat: ARRAY }
        )
          .then(result => {
            if (JSON.parse(result.response)) {
              result.response = JSON.parse(result.response);
              data.ROLE_FUNC.push({
                ROLE_NAME: result.id,
                FUNCTIONS: result.response
              });

              resolve({
                SYSTEM: data.SYSTEM,
                ROLE_NAME: result.id,
                ROLE_DESC: role.ROLE_DESC,
                FUNCTIONS: result.response
              });
            } else {
              reject(result);
            }
          })
          .catch(err => {
            reject(err);
          });
      } catch (err) {
        console.log(err);
      }
    });
  },

  // List of functions by roles
  massReqestFuncByRoles(req, res, data, request) {
    let reqFuncNames = [];
    data.ROLE_FUNC = [];

    for (let role of data.ROLES) {
      reqFuncNames.push(request(req, res, data, role));
    }

    return new Promise(async (resolve, reject) => {
      try {
        mkArr = async reqFuncNames => {
          let resFuncNames = [];
          for (req of reqFuncNames) {
            resFuncNames.push(await req);
          }
          return resFuncNames;
        };

        let resFuncNames = await mkArr(reqFuncNames);
        resFuncNames = await mdJSON(result, {
          arrMaxLvl: false,
          keepLastKeys: 2
        });

        let resultMod = {};
        for (system in resFuncNames) {
          let sumFunc = [];
          resultMod[system] = { ROLES: [], FUNCTIONS: [] };
          if (result.hasOwnProperty(system)) {
            for (role of result[system]) {
              sumFunc = sumFunc.concat(role.FUNCTIONS);
              resultMod[system].ROLES.push({
                ROLE_NAME: role.ROLE_NAME,
                ROLE_DESC: role.ROLE_DESC
              });
            }
          }
          resultMod[system].FUNCTIONS = [...new Set(sumFunc)];
        }
        resolve(resultMod);
      } catch (err) {
        console.log(err);
      }
    });
  },

  login(req, res) {
    return new Promise((resolve, reject) => {
      let login = req.body.login;

      let passhash = this.generateHash(req.body.password);
      console.log(passhash);

      // Request with login and pass
      requestDB(
        "login_pass",
        `SELECT COUNT(*) users 
         FROM AUTH_USERS 
         WHERE login = '${login}' AND passhash = '${passhash}'
        `,
        {},
        { outFormat: ARRAY }
      )
        .then(result => {
          console.log(result);
          let users = JSON.parse(result.response)[0];

          if (!users);
          return Promise.reject("Wrong user or password");
        })
        .then(() => {
          // Have cookie or session?
          return new Promise((resolve, reject) => {
            requestDB(
              "sessions",
              `SELECT COUNT(*) sessions 
               FROM AUTH_SESSIONS 
               WHERE ID_USER = (SELECT ID FROM "SYSTEM".AUTH_USERS WHERE login = '${login}') `,
              {},
              { outFormat: ARRAY }
            )
              .then(result => {
                let access_token_new = this.makeToken(req);
                let sessions = JSON.parse(result.response)[0];

                if (sessions) {
                  // Update session
                  return new Promise((resolve, reject) => {
                    this.getTokenByLogin(login)
                      .then(access_token => {
                        return new Promise((resolve, reject) => {
                          try {
                            this.updateCurSession(req, res, access_token)
                              .then(result => {
                                resolve(result);
                              })
                              .catch(err => {
                                console.log(err);
                                reject(err);
                              });
                          } catch (err) {
                            console.log(err);
                            reject(err);
                          }
                        });
                      })
                      .then(result => resolve(result))
                      .catch(err => {
                        console.log("Get token by login - error");
                        reject(err);
                      });
                  });
                } else {
                  // If there is no session, create it
                  return this.makeNewSession(req, res, access_token_new);
                }
              })
              .then(result => {
                resolve(result);
              })
              .catch(err => {
                reject(err);
              });
          });
        })
        .then(result => {
          console.log("in login Endless then");
          console.dir(result);
          resolve(result);
        })
        .catch(err => {
          console.log(" login catch");
          reject(err);
        });
    });
  },

  makeToken(req) {
    return this.generateHash(
      new Date() + req.body.login + req.body.password,
      "hex"
    );
  },

  generateHash(pass, digest) {
    if (digest) {
      return crypto
        .createHmac("sha256", sessionConfig.salt)
        .update(pass)
        .digest(digest);
    } else {
      return crypto
        .createHmac("sha256", sessionConfig.salt)
        .update(pass)
        .digest("base64");
    }
  },

  Template(response, comment) {
    return {
      response: response || "error",
      comment: comment || "unhandled error"
    };
  }
};
