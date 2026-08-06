from flask_login import UserMixin

# 系統只有單一管理員帳號，不建 users 資料表，
# 帳密比對直接用環境變數（見 app/config.py）。
ADMIN_USER_ID = "admin"


class AdminUser(UserMixin):
    def __init__(self):
        self.id = ADMIN_USER_ID


admin_user = AdminUser()
