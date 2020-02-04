// SQL
const uuid = require('uuid/v4');

let pc_staff_insert = (
	`INSERT INTO regpc.PC_STAFF (
	   ID_COMPANY,     
	   FULLNAME,
	   DATEBORN,
	   PLACEBORN, 
	   PASSPORT,               
	   PASSPORT_ISSUER,        
	   PASSPORT_DATE,         
	   ADDRESS_REG,            
	   EXPERIENCE_IN_COMPANY,  
	   PHONE_NUM,              
	   EMPL_CONTRACT,          
	   DIPLOM,  
	   INSURANCE_POLICY,       
	   INSURANCE_COMPANY,      
	   INSURANCE_AMOUNT,       
	   INSURANCE_START_DATE,   
	   INSURANCE_END_DATE,     
	   EXPERIENCE_ALL,         
	   ADDRESS_RESIDENTIAL,                  
	   POSITION_WEIGHT, 
	   SELFREG_PROOF_DOC,                     
	   ID_SELFREG_ORG,
	   DATE_ADD_TS
   )
   VALUES ( 
	   :ID_COMPANY,
	   :FULLNAME,
	   to_date(:DATEBORN, 'DD.MM.YYYY'),
	   :PLACEBORN,
	   :PASSPORT,
	   :PASSPORT_ISSUER,
	   to_date(:PASSPORT_DATE, 'DD.MM.YYYY'),
	   :ADDRESS_REG,
	   :EXPERIENCE_IN_COMPANY,
	   :PHONE_NUM,
	   :EMPL_CONTRACT,
	   :DIPLOM,
	   :INSURANCE_POLICY,
	   :INSURANCE_COMPANY,
	   :INSURANCE_AMOUNT,
	   to_date(:INSURANCE_START_DATE, 'DD.MM.YYYY'),
	   to_date(:INSURANCE_END_DATE, 'DD.MM.YYYY'),
	   :EXPERIENCE_ALL,
	   :ADDRESS_RESIDENTIAL,
	   :POSITION_WEIGHT,
	   :SELFREG_PROOF_DOC,        
	   ( SELECT ID FROM regpc.LISTS l WHERE SELFREG_ORG = :SELFREG_ORG ),
	   SYSTIMESTAMP
   )`);	

// qual_cert_insert
const qual_cert_insert = (data) => {

	let sql = ''
	if (data.length > 0) sql+=`INSERT ALL \n`
	data.forEach((cert, i) => {
		sql+=`	INTO regpc.QUAL_CERT (
			ID,
			ID_STAFF,
			NUM,
			DATE_START,
			DIRECTION_ID
		) VALUES ( 
			:ID_${i},
			id_staff,
			:NUM_${i},
			to_date(:DATE_START_${i}, 'DD.MM.YYYY'),
			(SELECT ID FROM regpc.QUAL_CERT_DIR_LIST WHERE direction = :DIRECTION_${i})
		)\n`
	});

	if (data.length > 0) sql+=`SELECT * FROM dual;`
	console.log(sql)
	return sql
	
}


module.exports = {
	pc_staff_insert,
	qual_cert_insert,
}
//module.exports = shemaPCattributes