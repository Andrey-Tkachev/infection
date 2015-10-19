from views.base_view import BaseView
import os


class RoomView(BaseView):

    def get(self):
        if (self.current_user):
            self.render(os.path.join('templates', 'room', 'room.html'))
        else:
            self.redirect('/')
