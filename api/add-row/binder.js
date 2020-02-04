/***********/
/* Binder */

const { STRING, NUMBER, NUMBER } = require('oracledb');

const _STRING = (val, chars) => { return { val: val, type: STRING, maxSize: chars * 2 } }
const _NUMBER = (val) => { return { val: parseInt(val), type: NUMBER } }
const _DATE = (val) => { return { val: val, type: STRING, maxSize: 10 * 2 } }

module.exports = {

    sova: (objInput, data, type) => {

        let bindsObj = {}
        let bindsArr = []

        let o = objInput

        switch (type) {

            case "add-new-company-attributes":

                bindsObj = {

                    psrn: _STRING(o.PSRN, 20),    // NVARCHAR2(20 CHAR)  
                    rgd: _DATE(o.REG_DATE),    // DATE   

                    okpo: _STRING(o.OKPO, 10),    // NVARCHAR2(10 CHAR)     
                    st: _STRING(o.SITE, 128),   // NVARCHAR2(128 CHAR)  

                    adbn: _STRING(o.ACCOUNT_DETAILS_BANK_NAME, 128),      // NVARCHAR2(128 CHAR)                         
                    adsa: _STRING(o.ACCOUNT_DETAILS_SETTLEMENT_ACC, 30),  // NVARCHAR2(30 CHAR)                             
                    adca: _STRING(o.ACCOUNT_DETAILS_CORR_ACC, 30),        // NVARCHAR2(30 CHAR)                         
                    adb: _STRING(o.ACCOUNT_DETAILS_BIC, 20),             // NVARCHAR2(20 CHAR)                 
                    ca: _NUMBER(o.CAPITAL_AMOUNT),                      // NUMBER(38,10)    

                    ftsc: _STRING(o.FEDERAL_TAX_SERVICE_CONTACTS, 1000),  // NVARCHAR2(1000 CHAR)                             
                    afi: _STRING(o.AFFILIATES_INFO, 1500),  // NVARCHAR2(1500 CHAR)             
                    insc: _STRING(o.INSURANCE_COMPANIES, 2000),  // NVARCHAR2(2000 CHAR)                 
                    aia: _NUMBER(o.APPRAISERS_INV_AVAILABILITY),         // NUMBER(1,0)                         
                    qapp: _NUMBER(o.QUANTITY_APPRAISERS),                 // NUMBER(38,3)                 
                    aqr: _NUMBER(o.AVG_QTY_REPORTS_IN_MOUNTH),           // NUMBER(38,3)                         
                    rvc: _STRING(o.RVC, 20),                             // NVARCHAR2(20 CHAR) 
                    abr: _STRING(o.ABBREVIATION, 1000),                  // NVARCHAR2(1000 CHAR)             
                    sbs: _STRING(o.SUBSIDIARIES, 1000),                  // NVARCHAR2(1000 CHAR)             
                    qad: _NUMBER(o.QUANTITY_APPRAISERS_DECLARED),        // NUMBER                             
                    rga: _STRING(o.REG_AGENCY, 1000),                    // NVARCHAR2(1000 CHAR)         
                    dssd: _DATE(o.DATE_OF_START_SD_CONCLUSION),         // DATE                         
                    dslc: _DATE(o.DATE_OF_START_LD_CONCLUSION),         // DATE                                           

                    id_company: { type: NUMBER, dir: BIND_OUT }

                }

                return bindsObj
                break;

            case "add-new-company-history-attributes":

                bindsObj = {

                    id_hist: _STRING(data.id_hist, 38),
                    id_company: _NUMBER(data.id_company),

                    roc: _STRING(o.STATUS_ROC, 32),
                    toc: _STRING(o.TYPE_OF_COMPANY, 64),
                    nm: _STRING(o.NAME, 1000),
                    tin: _STRING(o.TIN, 12),
                    rgpl: _STRING(o.REG_PLACE, 1000),
                    sumi: _NUMBER(o.SUM_INSURED),
                    dsip: _DATE(o.DATE_OF_START_INSURANCE_POLICY),
                    deip: _DATE(o.DATE_OF_END_INSURANCE_POLICY),
                    us: _NUMBER(data.id_user),
                }

                return bindsObj
                break;

            case "add-new-company-access-levels":

                //add-new-company-accessLevels                    
                o.forEach(region => bindsArr.push(

                    {
                        id_company: parseInt(data.id_company),

                        reg: region.REGION,
                        acc: parseInt(region.ACCESS_WEIGHT),
                        us: parseInt(data.id_user),

                    }

                ));

                return bindsArr;
                break;

            case "add-new-office-attributes":

                //add-new-company-accessLevels                    
                o.forEach((office, i) => bindsArr.push(
                    {
                        id_off: data.id_off[i],
                        id_company: parseInt(data.id_company),

                        ph: office.attributes.PHONE,
                        mph: office.attributes.MOBILE_PHONE,
                        fax: office.attributes.FAX,
                        eml: office.attributes.EMAIL

                    }

                ));

                return bindsArr;
                break;

            case "add-new-office-history-attributes":

                //add-new-company-accessLevels                    
                o.forEach((office, i) => bindsArr.push(
                    {
                        id_off: data.id_off[i],
                        adr: office.historyAttributes.OFFICE_ADDRESS,
                        us: parseInt(data.id_user),
                    }

                ));

                return bindsArr;
                break;

            case "add-new-office-presence-locality":

                //add-new-company-accessLevels                    
                o.forEach((office, offNum) =>
                    office.presenceLocality.forEach((locality, locNum) =>
                        bindsArr.push({

                            id_off_pl: data.id_off_pl[offNum][locNum],
                            id_off: data.id_off[offNum],
                            id_company: data.id_company,
                            st: locality.STATE,
                            lc: locality.LOCALITY,
                        }
                        )

                    ));

                return bindsArr;
                break;

        }

    },


}