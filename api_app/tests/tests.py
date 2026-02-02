from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from api_app.models import Task, UserTask, UserTaskRole, TaskPriority, TaskStatus


class TaskRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()

        self.password = "TestPass123!"
        self.owner = User.objects.create_user(username="owner", password=self.password, email="o@example.com")
        self.assigned = User.objects.create_user(username="assigned", password=self.password, email="a@example.com")
        self.viewer = User.objects.create_user(username="viewer", password=self.password, email="v@example.com")
        self.stranger = User.objects.create_user(username="stranger", password=self.password, email="s@example.com")

        # Create task authored by owner
        self.task = Task.objects.create(
            title="RBAC task",
            description="demo",
            deadline="2026-01-01",
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.TODO,
            assigned_by=self.owner,
        )

        # Memberships
        UserTask.objects.update_or_create(
            task=self.task,
            user=self.owner,
            defaults={"role": UserTaskRole.OWNER},
        )
        UserTask.objects.update_or_create(
            task=self.task,
            user=self.assigned,
            defaults={"role": UserTaskRole.ASSIGNED},
        )
        UserTask.objects.update_or_create(
            task=self.task,
            user=self.viewer,
            defaults={"role": UserTaskRole.VIEWER},
        )


    def auth_as(self, user):
        # Use your existing login endpoint to get a real JWT access token
        res = self.client.post(
            "/api/login/",
            {"username": user.username, "password": self.password},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        access = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_owner_can_delete(self):
        self.auth_as(self.owner)
        res = self.client.delete(f"/api/tasks/{self.task.id}/")
        self.assertEqual(res.status_code, 204, res.content)

    def test_assigned_cannot_delete(self):
        self.auth_as(self.assigned)
        res = self.client.delete(f"/api/tasks/{self.task.id}/")
        self.assertIn(res.status_code, (403, 404), res.content)

    def test_assigned_can_patch(self):
        self.auth_as(self.assigned)
        res = self.client.patch(
            f"/api/tasks/{self.task.id}/",
            {"status": TaskStatus.IN_PROGRESS},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)

    def test_viewer_cannot_patch(self):
        self.auth_as(self.viewer)
        res = self.client.patch(
            f"/api/tasks/{self.task.id}/",
            {"status": TaskStatus.DONE},
            format="json",
        )
        self.assertIn(res.status_code, (403, 404), res.content)

    def test_viewer_can_get(self):
        self.auth_as(self.viewer)
        res = self.client.get(f"/api/tasks/{self.task.id}/")
        self.assertEqual(res.status_code, 200, res.content)

    def test_stranger_cannot_get(self):
        self.auth_as(self.stranger)
        res = self.client.get(f"/api/tasks/{self.task.id}/")
        self.assertIn(res.status_code, (403, 404), res.content)
