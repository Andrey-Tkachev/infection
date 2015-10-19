from views.base_view import BaseView


class RoomConnectorView(BaseView):

    def get(self, room_id, user_name):
        user_name = self.get_query_arguments('user_name')[0]
        room_id = self.get_query_arguments('room_id')[0]
        if (room_id in self.application.rooms_manager.rooms_dict):
            room = self.application.rooms_manager.get_room(room_id)
            if self.current_user:
                if self.current_user not in room.players_dict:
                    if len(room.players_dict) < room.players_num:
                        room.add_player(str(self.current_user), user_name)
                        self.application.rooms_manager.rooms_dict[
                            room_id] = room
                        self.set_cookie("room_id", room.objectid)
                        # player = {'color': room.get_color_by_player(self.current_user),
                                  #'nick':  self.get_cookie('nick')}
                        self.redirect('/room/')
        else:
            self.redirect('/')
