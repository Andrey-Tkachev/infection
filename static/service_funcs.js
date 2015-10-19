function cellFactory(color, row_id, col_id)
{
    var cell = document.createElement('div');
    cell.className = 'cell ' + color;
    cell.id = 'c_row_' + row_id.toString() + '_' + col_id.toString(); 
    return cell;
}

function getXY(cell_id)
{
	var cellXY = cell_id.split('_');
	cellXY = { X: parseInt(cellXY[2]), Y: parseInt(cellXY[3]) };
	return cellXY;		
}

function cellForCaptureNameFactory(x, y)
{
	return 'c_row_' + x.toString() + '_' + y.toString();
}

function getColorFromClass (attr_class) {
	attr_class  = attr_class.split(' ');
	var colors = new Array('red', 'blue', 'purple', 'green');
	for (var i=0; i<colors.length; i++){
		for (var j=0; j<attr_class.length; j++)
		{	
			if (attr_class[j] == colors[i])
			{
				return colors[i];
			}	
		}
	} 

	return 'empty';
}

function nextColor(curr_color)
{
    switch(curr_color)
    {
        case 'purple':
            curr_color = 'blue';
            break;
        case 'blue':
            curr_color = 'red';
            break;
        case 'red':
            curr_color = 'green';
            break;
        case 'green':
            curr_color = 'empty';
            break;
        case 'empty':
            curr_color = 'purple';
            break;   
    }
    return curr_color;

}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function buildTable(table_json)
{   
    rows = JSON.parse(table_json);
    for (var row_id=0; row_id < rows.length; row_id++){
        row_str = rows[row_id].toString();
        
        var new_raw = document.createElement('tr');
        new_raw.className = 'cell_row';
        new_raw.id = 'game_row_' + row_id.toString();
        

        for (var i=0; i<row_str.length; i++)
        {
            new_column = document.createElement('td');
            new_column.id = 'game_column_' + row_id.toString() + '_' + i.toString(); 
            new_column.className = 'cell_column';
            cell_color = null;
            switch(rows[row_id][i])
            {
                case 'p':
                    cell_color = 'purple';
                    break;
                case 'b':
                    cell_color = 'blue';
                    break;
                case 'r':
                    cell_color = 'red';
                    break;
                case 'g':
                    cell_color = 'green';
                    break;
                case 'e':
                    cell_color = 'empty';
                    break;
            }
            new_cell = cellFactory(cell_color, row_id, i) 
            new_column.appendChild(new_cell);
            new_raw.appendChild(new_column);
        }
        game_table.appendChild(new_raw);
    }
}