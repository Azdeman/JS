var app = require('express')();
var http = require('http').createServer(app);
var mysql = require('mysql');
var WebSocket = require('ws');

// var connection = mysql.createConnection({
//     host     : '31.31.198.115',
//     user     : 'u0942383_plannot',
//     password : '0N7j6Y9y',
//     database : 'u0942383_plannote'
// });

var connection = mysql.createPool({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'PlanNote'
});

connection.query('SET CHARACTER SET utf8');

connection.query('SELECT 1+1',(err,rows)=>{});


app.get('/', (req, res)=>{
	res.sendFile(__dirname + '/client.html');
});

function DeleteUsers(socketID){
var delete_id = socketID;
for(let i in users){
   for(let j=0; j<users[i].length;j++ ){
   		if(users[i][j]!=undefined || users[i][j]!=null)
      		 if(users[i][j]['socket_key']==delete_id)
            		delete users[i][j];
    }
			}
}

function DateFormat(date,flag){
	var new_date = '';
	if(flag=='user'){
		var date = date.split('.');
		new_date = date[2]+'-'+date[1]+'-'+date[0];
	}else{
		var date = date.split('-');
		new_date = date[2]+'.'+date[1]+'.'+date[0];
	}
		return new_date;
}

function SendInfo(OBJ_SEND, ROOM, BROADCAST = false, socket){
	users[ROOM].forEach((user)=>{
				if(user.connect.readyState === WebSocket.OPEN){
						var json_send = JSON.stringify(OBJ_SEND);
						if(!BROADCAST){
								user.connect.send(json_send);
						}else{
							if(JSON.stringify(user.connect)!=JSON.stringify(socket)){
								user.connect.send(json_send);
							}
						}
					}
		});
}

async function INFO_SELECT(table_name, get_colum, where){
	let sql_  = "SELECT `"+get_colum+"` FROM `"+table_name+"` "+where+"";
		return new Promise((resolve,reject)=>{
			connection.query(sql_,(err,result)=>{
				var json_result_select = JSON.parse(JSON.stringify(result));
						resolve(json_result_select);
								
				});
		});
}

async function INFO_UPDATE(table_name, get_column_update, where){
	let sql_  = "UPDATE `"+table_name+"` SET "+get_column_update+" "+where+"";
		return new Promise((resolve,reject)=>{
			connection.query(sql_,(err,result)=>{
						resolve(result.affectedRows);
				});
		});
}

async function INFO_INSERT(table_name, get_column_insert){
	let sql_  = "INSERT INTO `"+table_name+"` VALUES ("+get_column_insert+")";
		return new Promise((resolve,reject)=>{
			connection.query(sql_,(err,result)=>{
						resolve(result.insertId);
		});
	});
}



var users = {};

const ws = new WebSocket.Server({port:3000});

	ws.on('connection',(socket,req)=>{
		var send_key = req.headers['sec-websocket-key'];
			//socket.send(send_key);
		socket.on('message', async (message)=>{
					var json 		 = JSON.parse(message),
						key_plannote = json.KEY,
						id_keygen 	 = await INFO_SELECT('keygen','id','WHERE `key_` = "'+key_plannote+'"');

							if(id_keygen!=false){
								id_keygen = id_keygen[0]['id'];
							}

					if(json.ACTION == 'GET_CURRENT_WEEK'){
						
								if(!users.hasOwnProperty(key_plannote)){ //если группы еще не сущетсвует
										users[key_plannote] = [];
										users[key_plannote].push({'socket_key' : send_key, 'connect' : socket });
								}else{ //если существует
										users[key_plannote].push({'socket_key' : send_key, 'connect' : socket }); //добавлям нового пользователя
								}
								
								//запросы


								var OBJ_SEND  = {};
									OBJ_SEND["ACTION"]  = "UPDATE_CURRENT_WEEK";
									OBJ_SEND["ITEM"] 	=  {};
									OBJ_SEND["ITEM"].note = 1;
									OBJ_SEND["ITEM"].template = 2;
									OBJ_SEND["ITEM"].days = {"09.02.2000":'Текст'};
									OBJ_SEND["STATUS"] = 200;


								socket.send(JSON.stringify(obj__)); // отправляем информацию в первые подключившемуся

					}else if(json.ACTION == 'SET_NOTE'){ //добавление или изменение
							// var now_notes = json.note;

							var now_notes = 'Новая заметка!';
							let notes  = await INFO_SELECT('notes','id','WHERE `id_keygen` = "'+id_keygen+'"');
								
											if(notes!=false){
												var info_update = await INFO_UPDATE('notes','`note` ="'+now_notes+'"','WHERE `id_keygen` = "'+id_keygen+'"');
													if(info_update){
														var obj__ = {

																"ACTION" : 'UPDATE_NOTE' ,
																"note" : now_notes ,
														};
														SendInfo(obj__, key_plannote, true, socket);
													}
											}else{
												var insert_notes = await INFO_INSERT('notes',"'','"+id_keygen+"','"+now_notes+"',NOW()");
													if(insert_notes){
														SendInfo(obj__, key_plannote, true, socket);
													}
											}
							

					}else if(json.ACTION == 'SET_TEMPLATE'){
						// var now_templates = json.template;

						var now_templates = 'Новый шаблон';
						let templates  = await INFO_SELECT('templates','id','WHERE `id_keygen` = "'+id_keygen+'"');
								
											if(templates!=false){
												var info_update = await INFO_UPDATE('templates','`text` ="'+now_templates+'"','WHERE `id_keygen` = "'+id_keygen+'"');
													if(info_update){
														var obj__ = {

																"ACTION" : 'UPDATE_TEMPLATE' ,
																"note" : now_templates ,
														};
														SendInfo(obj__, key_plannote, true, socket);
													}
											}else{
												var insert_templates = await INFO_INSERT('templates',"'','"+id_keygen+"','"+now_templates+"',NOW()");
													if(insert_templates){
														SendInfo(obj__, key_plannote, true, socket);
													}
											}

					}else if(json.ACTION == 'SET_DAY'){
						// var date = Object.keys(json)[2];
						// var now_diaries = Object.values(json)[2]
							var date = '16.03.2020'; //время от пользователя
							var now_diaries = 'Новая diaries'; //заметка от пользователя
							var date_form  = DateFormat(date,'user'); //преобразовываем дату как в бд

								let diaries  = await INFO_SELECT('diaries','id','WHERE `id_keygen` = "'+id_keygen+'" AND `date` = "'+date_form+'"');
									if(diaries!=false){
												var info_update = await INFO_UPDATE('diaries','`text` ="'+now_diaries+'",`updates` = NOW()','WHERE `id_keygen` = "'+id_keygen+'" AND `date` = "'+date_form+'"');
													if(info_update){
														var obj__ = {

																"ACTION" : 'UPDATE_DAY' ,
														};
														obj__[date] = now_diaries;
														SendInfo(obj__, key_plannote, true, socket);
													}
									}else{
										var insert_diaries = await INFO_INSERT('diaries',"'','"+id_keygen+"','"+now_diaries+"',CURDATE(), NOW()");
													if(insert_diaries){
														SendInfo(obj__, key_plannote, true, socket);
													}
									}


					}else if(json.ACTION == 'GET_NOTE'){

						var get_note  = await INFO_SELECT('notes','note','WHERE `id_keygen` = "'+id_keygen+'"');
									console.log(get_note);
								var obj__ = {

												"ACTION" : 'RES_GET_NOTE',
												"note"   : (get_note!=false) ? get_note[0]['note'] : 'No Note'
											};
										
									socket.send(JSON.stringify(obj__));


					}else if(json.ACTION == 'GET_TEMPLATE'){

						var get_template  = await INFO_SELECT('templates','text','WHERE `id_keygen` = "'+id_keygen+'"');
									
								var obj__ = {

												"ACTION" : 'RES_GET_TEMPLATE',
												"template"   : (get_template!=false) ? get_template[0]['text'] : 'No Template'
											};
										
									socket.send(JSON.stringify(obj__));

					}else if(json.ACTION == 'GET_DAY'){
						// var date = Object.keys(json)[1];
							var date = '16.03.2020'; //время от пользователя
							var date_form  = DateFormat(date,'user'); //преобразовываем дату как в бд
							var get_diaries  = await INFO_SELECT('diaries','text','WHERE `id_keygen` = "'+id_keygen+'" AND `date` = "'+date_form+'"');

											var obj__ = {

																"ACTION" : 'RES_GET_DAY' ,
														};
											obj__[date] = (get_diaries!=false) ? get_diaries[0]['text'] : 'No Diaries';
										
									socket.send(JSON.stringify(obj__));

					}

				});

socket.on('close', function () {
     console.log('close and deleted: '+ send_key );
     		DeleteUsers(send_key);
  });

});
