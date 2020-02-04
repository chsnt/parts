const uuid = require('uuid/v4');
//const auth = require('../../../../auth.js');


const {STRING,NUMBER,BIND_OUT,DATE}   = require('oracledb');
const _STRING = (val, chars) => { return { val: val, type: STRING , maxSize: chars*2 } };
const _NUMBER = (val)        => { return { val: parseInt(val), type: NUMBER } };
const _DATE   = (val)        => { return { val: val, type: STRING , maxSize: 10*2 }};
 

let pc_staff_bind = (data) => {	

	return {
        "FULLNAME":              _STRING(data.FULLNAME, 2000),
        "ID_COMPANY":            _NUMBER(data.ID_COMPANY),
        "PLACEBORN":             _STRING(data.PLACEBORN, 2000),
        "DATEBORN":              _DATE(data.DATEBORN),
        "PASSPORT_ISSUER":       _STRING(data.PASSPORT_ISSUER, 2000),
        "PASSPORT":              _STRING(data.PASSPORT, 2000),
        "ADDRESS_REG":           _STRING(data.ADDRESS_REG, 2000),
        "PASSPORT_DATE":         _DATE(data.PASSPORT_DATE),
        "PHONE_NUM":             _STRING(data.PHONE_NUM, 20),
        "EXPERIENCE_IN_COMPANY": _NUMBER(data.EXPERIENCE_IN_COMPANY),
        "DIPLOM":                _STRING(data.DIPLOM, 2000),
        "EMPL_CONTRACT":         _STRING(data.EMPL_CONTRACT, 2000),
        "INSURANCE_POLICY":      _STRING(data.INSURANCE_POLICY, 2000),
        "INSURANCE_AMOUNT":      _NUMBER(data.INSURANCE_AMOUNT),
        "INSURANCE_COMPANY":     _STRING(data.INSURANCE_COMPANY, 2000),
        "INSURANCE_END_DATE":    _DATE(data.INSURANCE_END_DATE),
        "INSURANCE_START_DATE":  _DATE(data.INSURANCE_START_DATE),
        "ADDRESS_RESIDENTIAL":   _STRING(data.ADDRESS_RESIDENTIAL, 2000),
        "EXPERIENCE_ALL":        _NUMBER(data.EXPERIENCE_ALL),
        "POSITION_WEIGHT":       _NUMBER(data.POSITION_WEIGHT),
        "SELFREG_ORG":           _STRING(data.SELFREG_ORG, 64),
        "SELFREG_PROOF_DOC":     _STRING(data.SELFREG_PROOF_DOC, 2000),
        "id_staff":              { type: NUMBER, dir: BIND_OUT },
	}
}


let qual_cert_bind = (data) => {

    let bind = {}
    data.forEach((cert, i) => {
        let obj = {}
        obj["ID_" + i]  = _STRING(uuid(), 40)
        obj["NUM_" + i] = _STRING(cert.NUM, 128)
        obj["DATE_START_" + i] = _DATE(cert.DATE_START)
        obj["DIRECTION_" + i]  = _STRING(cert.DIRECTION, 128)

        bind = {
            ...bind,
            ...obj
        }           
    })

    return bind
}


//----
module.exports = {
    pc_staff_bind,
    qual_cert_bind
}