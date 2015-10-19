$(function ()
{
	server_url = 'http://' + window.location.host.toString();
	
	function test_user(user)
	{
		var reg = new RegExp("[a-b,A-Z,0-9]{1,10}");
		return (reg.test(user));
	}

	function test_room(room_id)
	{
		var reg = new RegExp("[a-b,A-Z,0-9]{1,20}");
		return (reg.test(room_id));
	}

	$('#search_butt').click(function () {
		nick = $("#nick").val();
		if (test_user(nick)){
			document.location = server_url + '/search/?user_name=' + nick;
		}
		else{
			alert('Введите имя!');
		}
	});

	$('#joi_butt').click(function () {
		nick = $("#nick").val();
		room_id = $('#room_id').val()
		if (test_user(nick) && test_room(room_id)){
			document.location = server_url + '/connect/?room_id=' + room_id + '&user_name=' + nick;
		}	
		else{
			alert('Не правильный формат!');
		}
	});

	$('#create_butt').click(function () {
		nick = $("#nick").val();
		if (test_user(nick)){
			document.location =  server_url + '/create/?user_name=' + nick;
		}	
		else{
			alert('Не правильный формат!');
		}
	});
}); 