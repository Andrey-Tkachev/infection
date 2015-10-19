import os

import tornado.web
import tornado.ioloop
import tornado.websocket
from tornado import template

import hashlib

import pymongo
import random

from models.room import RoomsManager

from views.start_screen_view import StartScreenView
from views.room_connector_view import RoomConnectorView
from views.room_searcher_view import RoomSearcherView
from views.room_creator_view import RoomCreatorView
from views.room_view import RoomView

from sockets.room_socket import RoomSocket

BASE_DIR = os.path.dirname(__file__)


class Application(tornado.web.Application):

    def __init__(self):
        client = pymongo.MongoClient('localhost', 27017)
        self.db = client.rooms
        self.rooms_manager = RoomsManager(self.db)
        self.webSocketsPool = []

        settings = {
            'static_path': os.path.join(os.path.dirname(__file__), "static"),
            'static_url_prefix': '/static/',
            'cookie_secret': "YOUR_RANDOM_STRING="
        }

        handlers = (
            (r'/$', StartScreenView),
            (r'/connect/?(?P<room_id>[A-Za-z0-9-]+)?-?(?P<user_name>[0-9,a-z,A-Z]{1,10})?$', RoomConnectorView),
            (r'/create/?(?P<user_name>[0-9,a-z,A-Z]+)?$', RoomCreatorView),
            (r'/room/$', RoomView),
            (r'/search/?(?P<user_name>[0-9,a-z,A-Z]{1,20})?$', RoomSearcherView),
            (r'/room/([0-9,a-z]+)/$', RoomSocket)
        )

        tornado.web.Application.__init__(self, handlers, **settings)

application = Application()


if __name__ == '__main__':
    application.listen(8000, '192.168.0.153')
    tornado.ioloop.IOLoop.instance().start()
