/* const {
	shema_pcattributes_insert,
	pc_attributes_bind,
	pc_attributes_bind_del,
	shema_pcattributes_updata,
	pc_attributes_bind_updata,
	shema_pcattributes_hists_insert,
	pc_attributes_hists_bind
} = require('./sql-shema/shema-PC_ATTRIBUTES') */

const {OBJECT, ARRAY} = require('oracledb');
const sql = require('./sql.js');
const bind = require('./bind.js');

class makeSQL  {
	constructor(args) {
		// code
	}

	static makeSelect(id_comapny){

		let whereId = (id) => {
			return id? ` WHERE ID_COMPANY = ${id}\n`:``;
		}
		
		let queryString= `
			SELECT *
			FROM PC_STAFF_HUM_VIEW
			${whereId(id_comapny)} 
			`;
		
		return {
			queryString: queryString,
			bind:undefined,
			optionsObj: { outFormat: OBJECT }
		}
	} 

	static makeSelectPositionWeight(){
		
		let queryString= `
			SELECT 
				POSITION, WEIGHT
			FROM POSITION_WEIGHT
			`;
		
		return {
			queryString: queryString,
			bind:undefined,
			optionsObj: { outFormat: OBJECT }
		}
	} 	
	
	static makeInsert(data){
		
		/*let queryString= `
			DECLARE
				id_staff number;
				BEGIN 
					SAVEPOINT savepnt;
					${sql.pc_staff_insert} RETURNING "ID" INTO :id_staff;
					id_staff := :id_staff;
					${sql.qual_cert_insert};
				COMMIT;
				EXCEPTION
					WHEN OTHERS THEN
					ROLLBACK TO savepnt;
					RAISE;
			END;`;	*/

			let queryString= `
			DECLARE
				id_staff number;
				BEGIN 
					SAVEPOINT savepnt;
					${sql.pc_staff_insert} RETURNING "ID" INTO :id_staff;
					id_staff := :id_staff;
					${sql.qual_cert_insert(data.QUAL_CERTS)}
				COMMIT;
				EXCEPTION
					WHEN OTHERS THEN
					ROLLBACK TO savepnt;
					RAISE;
			END;`;
			

		return {
			queryString:queryString,
			bind: {...bind.pc_staff_bind(data), ...bind.qual_cert_bind(data.QUAL_CERTS)},
			optionsObj:{ autoCommit: false }
		}	
			
		/* return {
			queryString:queryString,
			bind: bind.pc_staff_bind(data),
			optionsObj:{ autoCommit: true }
		}	 */
	} 	
	

	static makeUpdate(data){

		//let pc_attributes_sql_string=`${shema_pcattributes_updata}`;

		let pc_attributes_sql_string = `
			DECLARE
				id_com  number;
				BEGIN 
					SAVEPOINT update_bar;
						${shema_pcattributes_updata};
				COMMIT;
				EXCEPTION
					WHEN OTHERS THEN
					ROLLBACK TO update_bar;
					RAISE;
			END;`;

		return {
			queryString:pc_attributes_sql_string,
			bind:pc_attributes_bind_updata(data),
			optionsObj:{ autoCommit: true }
		}

	}

	static makeDelete(data){
		let pc_attributes_sql_string = `
			DECLARE
				id_com  number;
				BEGIN 
					SAVEPOINT update_bar;
						DELETE FROM PC_ATTRIBUTES WHERE ID = :ID;
				COMMIT;
				EXCEPTION
					WHEN OTHERS THEN
					ROLLBACK TO update_bar;
					RAISE;
			END;`;

		return {
			queryString:pc_attributes_sql_string,
			bind:pc_attributes_bind_del(data),
			optionsObj:{ autoCommit: true }
		}	
	}		
	
}

module.exports = makeSQL


// let queryString = `
// 			DECLARE
// 				id_com  number;
// 				BEGIN 
// 					SAVEPOINT update_bar;
// 					INSERT INTO TEST_CUSTOMERS (ID, NAME, AGE) 
// 						VALUES (:ID,:NAME,:AGE)  RETURNING "ID" INTO id_com;
// 					INSERT INTO TEST_WIN_PIN (ID, NAME, AGE) 
// 						VALUES (id_com,:NAME,:AGE);
// 				COMMIT;
// 				EXCEPTION
// 					WHEN OTHERS THEN
// 					ROLLBACK TO update_bar;
// 					RAISE;
// 			END;`;