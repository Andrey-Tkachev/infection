from bson.objectid import ObjectId
import json


class Room():

    def __init__(self, players_num, objectid, table, current_color='purple'):

        if players_num:
            self.players_num = players_num
        else:
            self.players_num = 0
            for el in ['p', 'b', 'g', 'r']:
                if el in table:
                    self.players_num += 1

        self.objectid = objectid
        self.current_color = current_color

        self.players_dict = {}
        self.alredy_ex = []
        self.colors = []
        self.winner = None

        for col in ['p', 'b', 'g', 'r']:
            if col in table:
                self.colors.append(
                    {'p': 'purple',
                     'b': 'blue',
                     'g': 'green',
                     'r': 'red'}[col])

        if current_color in self.colors:
            self.current_color = current_color
        else:
            self.current_color = self.colors[0]

        self.users_nicks = {}
        self.color_player_dict = {'purple': None, 'blue': None, 'green': None, 'red': None}
        self.player_color_dict = {}
        self.status = 'waiting'

    def get_player_by_color(self, color):
        if color in self.color_player_dict:
            return self.players_dict[self.color_player_dict[color]]
        return None

    def get_color_by_player(self, player_id):
        if player_id in self.player_color_dict:
            return self.player_color_dict[player_id]
        return None

    def add_player(self, player_id, name):
        self.players_dict[player_id] = False
        self.users_nicks[player_id] = name
        for color in self.colors:
            if not self.color_player_dict[color]:
                self.color_player_dict[color] = player_id
                self.player_color_dict[player_id] = color
                break

    def dell_player(self, player_id):
        self.players_dict[player_id] = False
        return self

    def change_row(self, row, i, to):
        return row[:i] + to + row[i + 1:]

    def update_table(self, move, table):
        print('Table updating')

        pymove = json.loads(move)
        pytable = json.loads(table)

        print('Old table:')
        for row in pytable:
            print('  ', row)

        x0, y0 = int(pymove['X0']), int(pymove['Y0'])
        x1, y1 = int(pymove['X1']), int(pymove['Y1'])

        print('Move from ({}, {}) to ({}, {})'.format(x0, y0, x1, y1))

        if ((abs(x1 - x0) > 1) or (abs(y1 - y0) > 1)):
            pytable[x0] = self.change_row(pytable[x0], y0, 'e')

        for i in range(-1, 2):
            for j in range(-1, 2):
                if (x1 + i < len(pytable)) and (x1 + i > -1):
                    if (y1 + j < len(pytable[x1])) and (y1 + j > -1):
                        if pytable[x1 + i][y1 + j] != 'e':
                            pytable[x1 + i] = self.change_row(pytable[x1 + i], y1 + j, self.current_color[0].lower())

        pytable[x1] = self.change_row(pytable[x1], y1, self.current_color[0].lower())
        res = json.dumps(pytable)
        if 'e' not in res:
            r_count = (res.count('r'), 'red')
            b_count = (res.count('b'), 'blue')
            g_count = (res.count('g'), 'green')
            p_count = (res.count('p'), 'purple')
            sort_list = [r_count, b_count, p_count, g_count]
            sort_list.sort()
            self.winner = sort_list[-1][1]

        print('New table:')
        for row in pytable:
            print('  ', row)

        return res

    def can_move(self, table):
        pytable = json.loads(table)
        for row_id, row in enumerate(pytable):
            for char_id in range(len(row)):
                char = row[char_id]
                if char == self.current_color[0].lower():
                    for i in range(-2, 3):
                        for j in range(-2, 3):
                            if (row_id + i < len(pytable)) and (row_id + i > -1):
                                if (char_id + j < len(row)) and (char_id + j > -1):
                                    if pytable[row_id + i][char_id + j] == 'e':
                                        return True
        return False

    def change_color(self, table):
        print('Сolor changing')
        colors = self.colors
        self.current_color = colors[
            (colors.index(self.current_color) + 1) % self.players_num]
        i = 1
        while ((not self.players_dict[self.color_player_dict[self.current_color]]) or (not self.can_move(table))) and (i <= 5):
            self.current_color = colors[
                (colors.index(self.current_color) + 1) % self.players_num]
            i += 1

        if not self.can_move(table):
            return None

        return self.current_color


class RoomsManager():

    def __init__(self, db):
        # dict of rooms by their obj_id
        self.db = db
        self.rooms_dict = {}

    def get_room(self, objectid):
        if objectid not in self.rooms_dict:
            rid = objectid
            room_in_db = self.db.rooms.find_one({'_id': ObjectId(rid)})
            if room_in_db:
                print('Room', objectid, 'extrapolated from db')
                new_room = Room(
                    int(room_in_db['players_num']), rid, room_in_db['table'])
                new_room.current_color = room_in_db['current_color']
                for user_id in room_in_db['players']:
                    player = room_in_db['players'][user_id]
                    new_room.color_player_dict[player['color']] = user_id
                    new_room.player_color_dict[user_id] = player['color']
                    new_room.users_nicks[user_id] = player['nick']
                    new_room.players_dict[user_id] = None

                self.rooms_dict[rid] = new_room
            else:
                return None

        return self.rooms_dict[objectid]

    def add_room(self, room):
        self.rooms_dict[room.objectid] = room

    def rooms(self):
        for objectid in self.rooms_dict:
            yield self.rooms_dict[objectid]
