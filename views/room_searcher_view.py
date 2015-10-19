from views.base_view import BaseView



class RoomSearcherView(BaseView):

    def get(self, user_name):
        print('Search request from', self.request.remote_ip)
        user_name = self.get_query_arguments('user_name')[0]
        if self.current_user:
            user = str(self.current_user)
            for room in self.application.rooms_manager.rooms():
                print('Testing room', room.objectid)
                if (room.status == 'waiting') and (user not in room.players_dict):
                    room.add_player(user, user_name)
                    self.application.rooms_manager.rooms_dict[
                        room.objectid] = room
                    self.set_cookie("nick", user_name)
                    self.set_cookie("room_id", room.objectid)
                    self.redirect('/room/')
                    return
            self.redirect('/')
        else:
            self.redirect('/')
