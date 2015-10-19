from views.base_view import BaseView
from bson.objectid import ObjectId

import json
import tornado


class RoomSocket(tornado.websocket.WebSocketHandler, BaseView):

    def open(self, room_id):
        print('Player', self.request.remote_ip, 'has open room', room_id)

        self.user_id = str(self.current_user)

        if not self.current_user:
            self.redirect('/')
            return

        self.room_id = room_id
        room = self.application.rooms_manager.get_room(room_id)

        if self.user_id in room.players_dict:
            if not room.players_dict[self.user_id]:
                print('Player', self.request.remote_ip,
                      'has join to the room', room_id)
                self.application.rooms_manager.rooms_dict[
                    room_id].players_dict[self.user_id] = self

                for alr_ex in self.application.rooms_manager.rooms_dict[room_id].alredy_ex:
                    self.write_message(alr_ex)

                if room.status != 'playing':
                    room = self.application.rooms_manager.get_room(room_id)
                    player_info = json.dumps({'action': 'new_player',
                                              'ip': self.request.remote_ip,
                                              'color': room.get_color_by_player(self.user_id),
                                              'nick': room.users_nicks[self.user_id]
                                              })
                    for player_id in room.players_dict:
                        if room.players_dict[player_id]:
                            room.players_dict[player_id].write_message(player_info)

                    self.application.rooms_manager.rooms_dict[
                        room_id].alredy_ex.append(player_info)

                    if len(room.players_dict) == room.players_num:
                        for player_id in room.players_dict:
                            if (player_id == self.user_id) and (room.player_color_dict[player_id] == room.current_color):
                                continue
                            if room.players_dict[player_id]:
                                room.players_dict[player_id].write_message(json.dumps({'action': 'start',
                                                                                       'current_color': room.current_color}))
                        self.application.rooms_manager.rooms_dict[room_id].status = 'playing'

                        self._pass_the_course()
                elif room.status == 'playing':
                    if room.get_color_by_player(self.user_id) == room.current_color:
                        self._pass_the_course()
                    else:
                        self.write_message(json.dumps({'action': 'set_color',
                                                       'current_color': room.current_color}))
                else:
                    self.redirect('/')

    def on_message(self, message):
        message_dict = json.loads(message)
        db = self.application.db.rooms

        rid = self.room_id
        room = self.application.rooms_manager.get_room(rid)
        room_in_db = db.find_one({'_id': ObjectId(rid)})
        current_color = room.current_color
        current_player = room.get_player_by_color(current_color)

        if message_dict['request'] == 'get_table':
            print('Table request', self.request.remote_ip)
            self.write_message(
                json.dumps({'action': 'game_table',
                            'table': room_in_db['table']}))

        elif message_dict['request'] == 'get_current_color':
            print('Current color request', self.request.remote_ip)
            self.write_message(
                json.dumps({'action': 'set_color',
                            'current_color': current_color}))

        elif message_dict['request'] == 'make_move':
            print('Move request', self.request.remote_ip)
            if current_player == self:
                self.application.db.rooms.update_one({'_id': ObjectId(rid)},
                                                     {'$set': {'table': room.update_table(message_dict['move'],
                                                                                          room_in_db['table'])}})
                room_in_db = db.find_one({'_id': ObjectId(rid)})
                new_color = self.application.rooms_manager.rooms_dict[rid].change_color(room_in_db['table'])

                if self != room.get_player_by_color(new_color):
                    self.write_message(json.dumps({'action': 'set_color',
                                                   'current_color': new_color}))

                for player_id in room.players_dict:
                    if player_id != self.user_id:
                        if room.players_dict[player_id]:
                            room.players_dict[player_id].write_message(json.dumps({'action': 'move',
                                                                                   'move': message_dict['move'],
                                                                                   'current_color': new_color}))
                if room.winner:
                    for player_id in room.players_dict:
                        if room.players_dict[player_id]:
                            room.players_dict[player_id].write_message(json.dumps({'action': 'end',
                                                                                   'winner': room.winner}))
                    self.application.rooms_manager.rooms_dict[rid].status = 'end'
                else:
                    self._pass_the_course()
            else:
                self.write_message(json.dumps({'action': 'error'}))

    def on_close(self, message=None):
        print('Player', self.request.remote_ip, 'has left the room', self.room_id)

        self.application.rooms_manager.rooms_dict[
            self.room_id].dell_player(self.user_id)

        room = self.application.rooms_manager.get_room(
            self.room_id)

        col = room.get_color_by_player(self.user_id)
        if col == room.current_color:
            room_in_db = self.application.db.rooms.find_one(
                {'_id': ObjectId(self.room_id)})
            new_color = self.application.rooms_manager.rooms_dict[
                self.room_id].change_color(room_in_db['table'])

            for player_id in room.players_dict:
                if player_id != self.user_id:
                    if room.players_dict[player_id]:
                        room.players_dict[player_id].write_message(json.dumps({'action': 'set_color',
                                                                               'current_color': new_color}))
            if col != new_color:
                if room.get_player_by_color(player_id):
                    self._pass_the_course()

        for player_id in room.players_dict:
            player = room.players_dict[player_id]
            if player:
                if self.user_id != player_id:
                    player.write_message({'action': 'delete_player',
                                          'player_color': col})

    def _pass_the_course(self):
        room = self.application.rooms_manager.rooms_dict[self.room_id]
        print('Course passing to', room.current_color)
        current_player = room.get_player_by_color(room.current_color)
        current_player.write_message(json.dumps({'action': 'your_turn',
                                                 'current_color': room.current_color}))
