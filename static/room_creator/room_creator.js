var service_funcs = this;

    this.buildTable = buildTable;
    this.getColorFromClass = getColorFromClass;
    this.nextColor = nextColor;
    this.getXY = getXY;

$(document).ready(function() {
            var self = this;
            var server_url = window.location.host.toString();
            var rows_num = 1;
            var columns_num = 1;
            var players_num = 1;

            // game table as java object
            preTable =  new Array('e');

            // game table as json list
            var table_json = JSON.stringify(preTable);
            
            
            this.buildTable = service_funcs.buildTable;
            this.getColorFromClass = getColorFromClass;
            this.nextColor = nextColor;
            this.getXY = getXY;
            // its will be helpfull soon
            // this.getCookie = document_funcs.getCookie;

            clear();

            // clear game table
            function clear()
            {
                preTable = new Array('e');
                table_json = JSON.stringify(preTable);
                columns_num = 1;
                players_num = 1;
                
                var $input = $('#columns_num').find('input');
                $input.val(1);
                $input.change();
                var $input = $('#rows_num').find('input');
                $input.val(1);
                $input.change();
                update();
            }
            
            // building new game table after table resizing
            function update()
            {

                table_json = JSON.stringify(preTable);
                removeTable();
                self.buildTable(table_json);
                // change cell color after click 
                // this property should be added after every updating
                $('.cell').click(function () {
                    cell_color = self.getColorFromClass($(this).attr('class'));
                    next_color = self.nextColor(cell_color);
                    xy = self.getXY($(this).attr('id'));
                    old_row = preTable[xy.X]; 
                    new_row = old_row.slice(0, xy.Y) + next_color[0].toLowerCase() + old_row.slice(xy.Y + 1, old_row.length);
                    
                    preTable[xy.X] = new_row;
                    table_json = JSON.stringify(preTable);


                    $(this).removeClass(cell_color);
                    $(this).addClass(next_color);
                });
            }

            
            // submit button listener
            $('#submit-form').on('submit', function(evt) { 
                evt.preventDefault();
                send_date();
                return true; 
            }); 


            function addRow()
            {
                var new_row = '';

                for (var i=0; i<columns_num; i++)
                    new_row += 'e';

                preTable.push(new_row);
            }

            function removeRow()
            {
                preTable.pop()
            }

            function removeColumn()
            {
                for (var i=0; i<preTable.length; i++)
                {
                    preTable[i] = preTable[i].slice(0, -1);
                }
            }

            function addColumn()
            {
                for (var i=0; i<preTable.length; i++)
                {
                    preTable[i] += 'e';
                }
            }

            $('#delete_butt').click(function () {
                clear();
            });

            $('.minus').click(function () {
                var $input = $(this).parent().find('input');
                var count = parseInt($input.val()) - 1;

                if (count < 1)
                {
                    return false;
                }
                $input.val(count);
                $input.change();
                console.log($(this).attr('id')); 

                if ($(this).parent().attr('id') == 'columns_num')
                {
                    columns_num = count;
                    removeColumn();
                    update();
                } 
                if ($(this).parent().attr('id') == 'rows_num')
                {
                    rows_num = count;
                    removeRow();
                    update();
                } 
                
                return false;
            });

            $('.plus').click(function () {
                var $input = $(this).parent().find('input');
               var count = parseInt($input.val()) + 1;
                if (count > 20)
                {
                    return false;
                }
                $input.val(count);
                $input.change();

                if ($(this).parent().attr('id') == 'columns_num')
                {
                    columns_num = count;
                    addColumn();
                    update();
                } 

                if ($(this).parent().attr('id') == 'rows_num')
                {
                    rows_num = count;
                    addRow();
                    update();
                }
                
                return false;
            });

        function removeTable()
        {
            $('.cell_row').remove(); 
        }

         

        function send_date() {
            console.log('send_date'); // sanity check
            sending_date = { 
                game_table : table_json, 
                players_num :  parseInt($('#players_num').parent().find('input').val())};
            console.log(sending_date)
            ajax_params = {

                url : "http://" + server_url + "/create/", // the endpoint
                type : "POST", // http method
                //csrfmiddlewaretoken: csrftoken,
                data : sending_date, // data sent with the post request
                // handle a successful response
                success : function() {
                    window.location.replace('http://' + server_url + '/room/'); // remove the value from the input
                },
                // handle a non-successful response
                error : function() {
                    alert('Oops');
                }
            }
            $.ajax(ajax_params);
        }
});
    