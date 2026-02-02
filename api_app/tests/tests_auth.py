from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.password = "TestPass123!"
        self.user = User.objects.create_user(
            username="testuser",
            password=self.password
        )

    def login(self):
        res = self.client.post(
            "/api/login/",
            {"username": self.user.username, "password": self.password},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        return res.data["access"], res.data["refresh"]

    def test_profile_requires_auth(self):
        res = self.client.get("/api/profile/")
        # depending on config it can be 401 or 403, but usually 401
        self.assertIn(res.status_code, (401, 403), res.content)

    def test_login_and_profile_success(self):
        access, _refresh = self.login()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        res = self.client.get("/api/profile/")
        self.assertEqual(res.status_code, 200, res.content)

    def test_refresh_returns_new_access(self):
        _access, refresh = self.login()

        res = self.client.post(
            "/api/token/refresh/",
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertIn("access", res.data)

    def test_logout_blacklists_refresh(self):
        _access, refresh = self.login()

        # logout should blacklist refresh
        res = self.client.post(
            "/api/logout/",
            {"refresh": refresh},
            format="json",
        )
        self.assertIn(res.status_code, (200, 205), res.content)

        # trying to refresh again should fail (blacklisted)
        res2 = self.client.post(
            "/api/token/refresh/",
            {"refresh": refresh},
            format="json",
        )
        self.assertIn(res2.status_code, (401, 400), res2.content)
