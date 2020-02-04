const binder = require("./binder.js").sova;

const { STRING, NUMBER, NUMBER } = require("oracledb");

const {requestDB} = require("./requestDB.js")

const _STRING = chars => {
  return { type: STRING, maxSize: chars * 2 };
};
const _NUMBER = () => {
  return { type: NUMBER };
};

module.exports = {
  // historyAttributes
  historyAttributes: (objInput, cross) => {

    return new Promise((resolve, reject) => {
      try {
        reqObj = [];

        reqObj.push(`
                    INSERT INTO regpc.pc_attributes_hist (
                        ID,
                        ID_COMPANY,
                        ID_STATUS_ROC,
                        ID_TYPE_OF_COMPANY,            
                        NAME,            
                        TIN,
                        REG_PLACE,
                        SUM_INSURED,
                        DATE_OF_START_INSURANCE_POLICY,
                        DATE_OF_END_INSURANCE_POLICY,
                        DATETIME,
                        ID_USER
                    )
                    VALUES (
                        :id_hist, :id_company,
                        ( SELECT ID FROM regpc.LISTS WHERE STATUS_ROC = :roc ),
                        ( SELECT ID FROM regpc.LISTS WHERE TYPE_OF_COMPANY = :toc ),
                        :nm, :tin, :rgpl, :sumi, to_date(:dsip, 'DD.MM.YYYY'), to_date(:deip, 'DD.MM.YYYY'), SYSTIMESTAMP, :us                      
                    )                    
                `);

        reqObj.push(
          binder(
            objInput.company.historyAttributes,
            cross,
            "add-new-company-historyAttributes"
          )
        );
        reqObj.push({ autoCommit: true });

        requestDB("company.historyAttributes", ...reqObj)
          .then(comp_hist_attr => {
            if (comp_hist_attr.response) {
              resolve("ok");
            } else {
              throw new Error("cant add history company attributes");
            }
          })
          .catch(err => reject(err));
      } catch (err) {
        console.dir(err);
      }
    });
  },

  accessLevels: (objInput, cross) => {
  
    return new Promise((resolve, reject) => {
      try {
        reqObj = [];

        reqObj.push(`
                    INSERT INTO regpc.PC_ATTR_BY_REGIONS_HIST (
                        ID_COMPANY,
                        ID_REGION,
                        ACCESS_WEIGHT,
                        DATETIME,
                        ID_USER
                    )
                    VALUES (
                        :id_company,
                        ( SELECT ID FROM "SYSTEM".SHORT_LIST_REGIONS WHERE STATE = :reg ),
                        :acc, SYSTIMESTAMP, :us                      
                    ) 
                    RETURNING "ID" INTO :id_acc_lev                    
                `);

        reqObj.push(
          binder(
            objInput.company.accessLevels,
            cross,
            "add-new-company-accessLevels"
          )
        );
        reqObj.push({
          autoCommit: true,
          bindDefs: {
            id_company: _NUMBER(),

            reg: _STRING(255),
            acc: _NUMBER(),
            us: _NUMBER(),

            id_acc_lev: { type: NUMBER, dir: BIND_OUT }
          }
        });

        requestDB("company.accessLevels", ...reqObj)
          .then(comp_acc => {
            if (comp_acc.response > 0) {
              resolve(comp_acc);
            } else {
              throw new Error("cant add company access levels");
            }
          })
          .catch(err => reject(err));
      } catch (err) {
        console.dir(err);
      }
    });
  }
};
