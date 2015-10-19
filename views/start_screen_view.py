from views.base_view import BaseView
import hashlib
import random
import os


class StartScreenView(BaseView):

    def get(self):
        print('New player from', self.request.remote_ip)
        if not self.current_user:
            user_id = str(hashlib.sha224(
                (self.request.remote_ip + str(random.randint(1, 100000))).encode('utf-8')).hexdigest())
            print('****', user_id)
            self.set_secure_cookie('user_id', user_id)
        self.render(os.path.join('templates', 'start_screen', 'start_screen.html'))
