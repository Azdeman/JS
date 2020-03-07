var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var request= require('request');

app.get('/', (req, res)=>{
	res.sendFile(__dirname + '/client.html');
});

var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'u0942383_plannot',
    password : '0N7j6Y9y',
    database : 'u0942383_plannote',
    socketPath : '/var/run/mysqld/mysqld.sock',
    port : 80
});

connection.connect();

connection.query('SET SESSION wait_timeout=900000'); 
connection.query('SET CHARACTER SET utf8'); 



io.on('connection', function(socket){
  console.log('a user connected');
		socket.on('add_group',(data)=>{
				socket.join(data.rooms); //добавляем пользователя в группу
					//отправляем всем пользователям что подключился новый пользователь
					socket.broadcast.to(data.rooms).emit('add_sinhronizate_platform','Подключился '+data.plathorm); 
				//отправляем данные подключившемуся только что пользователю (заметки, шаблоны, ежедневные заметки)	
			connection.query("SELECT `id` FROM `keygen` WHERE `email`='"+data.rooms+"'",
					(error,result,fields)=>{
						if(result.length){
							var object_info = [];
								var id_keygen = JSON.parse(JSON.stringify(result))[0].id;

							//проверяем пароль и эмеил корый передан для авторизации
								var url_send_aut = `http://test1.ru/socket_aut.php?uid=${id_keygen}&password=${data.password}`;
								
								request(url_send_aut, function (error, response, body) {
									  	if(!body){
									  		io.to(socket.id).emit('global_info',{data:false}); //email не верный
									  			return;
									  	}

								var promise = new Promise((resolve,reject)=>{
										connection.query("SELECT `name`,`text`,`updates` FROM `templates` WHERE `id_keygen`='"+id_keygen+"'",
											(error,result,fields)=>{ 
												var templates = JSON.stringify(result); //вытягиваем template
													object_info.push({'templates':templates});		
										});

										connection.query("SELECT `text`,`date`,`updates` FROM `diaries` WHERE `id_keygen`='"+id_keygen+"'",
											(error,result,fields)=>{ 
												var diaries = JSON.stringify(result); //вытягиваем все заметки
													object_info.push({'diaries':diaries});	
															
														});

										connection.query("SELECT `note`,`updates` FROM `notes` WHERE `id_keygen`='"+id_keygen+"'",
											(error,result,fields)=>{ 
												var notes = JSON.stringify(result); //вытягиваем все заметки
													object_info.push({'notes':notes});	
															return resolve(object_info);
														});
										});

								promise.then((value)=>{
											io.to(socket.id).emit('global_info',{data:value})
								});	
						});
						}else{
							console.log('Такого emailа не существует!');
							io.to(socket.id).emit('global_info',{data:false}); //email не верный
						}
				});
					
					
		});
	
});
http.listen(3000, function(){
  		console.log('listening on *:3000');
});
