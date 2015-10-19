import tornado


class BaseView(tornado.web.RequestHandler):

    def get_current_user(self):
        return self.get_secure_cookie("user_id")
