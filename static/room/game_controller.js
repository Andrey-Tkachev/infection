$(function ()
	{
		
		var game_view = new view(sendMove);
		var server_url = window.location.host.toString();
		var preprocess =  new Array();
        var self = this;
        var room_id = getCookie('room_id');
        
        if (room_id == null)
        {
        	document.location = 'http://' + server_url + '/';
        }

        room_titile.innerHTML = room_titile.innerHTML + room_id;
        var socket = new WebSocket("ws://" + server_url +"/room/" + room_id + "/");
       
        socket.onopen = function()
        {
        	var table_req = JSON.stringify({request : 'get_table'});
        	socket.send(table_req);
        }

        var is_builded = false;

        function process_response(json){
        	switch(json.action){
				case 'game_table':
					game_view.buildTable(json.table);
					for (var i=0; i<preprocess.length; i++)
					{
						process_response(preprocess[i]);
					}
					preprocess = new Array();
					is_builded = true;
					break;

				case 'move':
					game_view.make_a_move(json.move);
					game_view.turn(json.current_color);
					break;

				case 'start':
					current_color = json.current_color;
					game_view.turn(current_color);
					break;

				case 'set_color':
					current_color = json.current_color;
					game_view.turn(current_color);
					break;
					
				case 'new_player':
					game_view.addPlayerToTable(json);
					break;

				case 'your_turn': 
					current_color = json.current_color;
					game_view.turn(current_color, true);
					break;

				case 'end':
					alert('Победил ' + document.getElementById('player_' + json.winner).innerHTML);
					game_view.turn('empty', true);
					document.location = 'http://' + server_url + '/';
					break;

				case 'error':
					alert('error');
					break;
			}
        }
        
        socket.onmessage = function(event) {

        	json_resp = JSON.parse(event.data);
        	console.log(event.data);
      		if ((json_resp.action != 'game_table') && (!is_builded)){
      			preprocess.push(json_resp);
      			return;
      		}
        	process_response(json_resp);

		};

		function sendMove(json_move){
			request = JSON.stringify({request : 'make_move', move : json_move});
			sendMessage(request);
		}

		function sendMessage(msg) {
	        waitForSocketConnection(socket, function(socket) {
	            socket.send(msg);
	        });
    	};

        function waitForSocketConnection(socket, callback){
        	setTimeout(
            	function(){
                	if (socket.readyState === 1) {
                    	if(callback !== undefined){
                        	callback(socket);
	                    }
	                    return;
	                } else {
	                    waitForSocketConnection(socket,callback);
	                }
	            }, 5);
    	};
	});

function view(callback) {
	this.playerColor = null;
	this.curr_cell_class = null;
	this.buildTable = buildTable;

	var self = this;
	var players_num = 0;

	this.addPlayerToTable = function(player_json)
	{
		player = player_json;
		var new_raw = document.createElement('tr');
		var icon_column = document.createElement('td');
		var icon_div = document.createElement('div');
			icon_div.className = 'player_icon ' + player.color;
		var player_column = document.createElement('td');
		var pl_div = document.createElement('div');
			pl_div.className = 'player_name';
			pl_div.id = 'player_' + player.color ;
			pl_div.innerHTML = player.nick;

		icon_column.appendChild(icon_div);
		new_raw.appendChild(icon_column);
		player_column.appendChild(pl_div);
		new_raw.appendChild(player_column);

		players_table.appendChild(new_raw);
		players_num++;

	}
	

	this.diactive_color = function (color, draggable_droppable)
	{
		color_class = '.cell.' + color;
		$('.player_icon.' + color).removeClass('entering');
		$(color_class).removeClass('entering');
		$(color_class).addClass('exit');
		if (draggable_droppable){
			$(color_class).draggable().draggable('destroy');
			//drop off to the cells which have been empty
			$(color_class).droppable().droppable('destroy');
		}
	}

	this.active_color = function (color, draggable)
	{
		color_class = '.cell.' + color;

		$('.cell').removeClass('exit');
		$('.cell').removeClass('entering');

		$('.player_icon.' + color).addClass('entering');
		$(color_class).addClass('entering');
		
		if (draggable){
			$(color_class).draggable(drag_prop);
		}
	}

	this.turn = function (color, draggable)
	{
		self.playerColor = color;
		self.diactive_color('red', true)
		self.diactive_color('blue', true)
		self.diactive_color('green', true)
		self.diactive_color('purple', true)
		self.active_color(color, draggable)
	}

	var drop_prop = {drop: function(event, ui) {
				  				$('div').removeClass('highlighting');
				  				capture($(this), $(ui.draggable[0]), callback);
				  				self.diactive_color(self.playerColor, true);
				  				self.diactive_color('empty', true);
			  				},
					}

	var drag_prop = { snap: ".cell.empty", 
					  snapMode: "inner", 
				  	  revert: 'invalid',

				  helper: function() {
						return ($(getGhost(this)));
				  },

				  start: function(){
					  	cellXY = getXY(this.id);
					  	
					  	var x = cellXY.X;
					  	var y = cellXY.Y;

					  	for (i=-2; i<3; i++){
					  		for (var j = -2; j<3; j++){
					  			if ((i != 0) || (j != 0))
					  			{	
					  				tag = '#' + cellForCaptureNameFactory(x + i, y + j);
					  				if (($('div').is(tag)) && (getColorFromClass($(tag).attr('class')) == 'empty'))
					  				{
					  					$(tag).droppable(drop_prop);
					  					$(tag).addClass('highlighting');
					  				}
						  		}
						  	}
						}
					 },

				  stop: function () {
				  			$('.ghost.' + self.playerColor).remove();
				  			$('div').removeClass('highlighting');
				  }
		};

	function getGhost(cell)
	{
		var ghost = document.createElement('div');
		ghost.className = 'ghost ' + getColorFromClass($(cell).attr('class'));
		ghost.style.width = cell.clientWidth.toString() + 'px';
		ghost.style.height = cell.clientHeight.toString() + 'px';
		ghost.style.zIndex = 1000;
		return ghost;
	} 

	function capture(cell, start_cell, callback)
	{
		start_cell_color = getColorFromClass(start_cell.attr('class'));
		cell.removeClass('empty');
		cell.addClass(start_cell_color);
		var cellXY = getXY(cell.attr('id')); 
		var x = cellXY.X;
		var y = cellXY.Y;


		
		var start_cellXY = getXY(start_cell.attr('id'))
		var x0 = start_cellXY.X, y0 = start_cellXY.Y;

		
		if ((Math.abs(x - x0) > 1) || (Math.abs(y - y0) > 1))
		{
			$(start_cell).removeClass(start_cell_color);
			$(start_cell).removeClass('exit');
			$(start_cell).addClass('empty');
		}

		self.diactive_color('empty', true);

		
		for (i=-1; i<2; i++)
		{
			for (var j = -1; j<2; j++) {
				if ((i != 0) || (j != 0))
				{	
					tag = '#' + cellForCaptureNameFactory(x + i, y + j)
					if ($('div').is(tag)){
						this_cell_color = getColorFromClass($(tag).attr('class'));
						if (this_cell_color != 'empty')
						{
							$(tag).removeClass(this_cell_color);
							$(tag).addClass(start_cell_color);
						}
					}
				}
			}
		}

		// Send to server
		if (callback){
			callback(JSON.stringify({X0 : x0, Y0 : y0, X1 : x, Y1: y}))
		}
		
	}

	this.make_a_move = function(json_move, with_ghost_animation)
	{
		move = JSON.parse(json_move)
		var x0 = move.X0, y0 = move.Y0;
		var x1 = move.X1, y1 = move.Y1;
		
		start_cell_name = '#' + cellForCaptureNameFactory(x0, y0);
		targ_cell_name = '#' + cellForCaptureNameFactory(x1, y1);
		
		start_color = getColorFromClass($(start_cell_name).attr('class'));
		self.diactive_color(start_color, true)
		
		capture($(targ_cell_name), $(start_cell_name));
		self.diactive_color('empty', true)
	}


}