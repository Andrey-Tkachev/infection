from views.base_view import BaseView
import os
from models.room import Room


class RoomCreatorView(BaseView):

    def get(self, user_name):
        user_name = self.get_query_arguments('user_name')[0]
        print('ROOM CREATOR GET from', self.request.remote_ip)
        if self.current_user:
            self.set_cookie('nick', user_name)
            self.render(os.path.join('templates', 'room_creator', 'create_room.html'))
        else:
            self.redirect('/')

    def post(self, user_name):
        print('ROOM CREATOR POST querry from', self.request.remote_ip)

        if self.current_user:
            table = self.get_argument('game_table')

            new_room = Room(None, None, table)
            new_room.add_player(
                str(self.current_user), self.get_cookie('nick'))

            player = {'color': new_room.get_color_by_player(self.current_user),
                      'nick': self.get_cookie('nick')}

            db = self.application.db
            obj_id = db.rooms.insert({
                'table': table,
                'players_num': new_room.players_num,
                'current_color': new_room.current_color,
                'players': {str(self.current_user): player}
            })

            new_room.objectid = str(obj_id)
            self.application.rooms_manager.add_room(new_room)

            # db room id to Cookies
            self.set_cookie("room_id", str(obj_id))
            self.redirect('/room/')
        else:
            self.redirect('/')
