from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from api_app.models import Task, UserTask, UserTaskRole, TaskPriority


class TaskMembershipTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()

        self.password = "TestPass123!"
        self.owner = User.objects.create_user(username="owner_m", password=self.password)
        self.assigned = User.objects.create_user(username="assigned_m", password=self.password)
        self.viewer = User.objects.create_user(username="viewer_m", password=self.password)
        self.other = User.objects.create_user(username="other_m", password=self.password)

        self.task = Task.objects.create(
            title="Memberships task",
            description="demo",
            deadline="2026-01-01",
            priority=TaskPriority.MEDIUM,
            assigned_by=self.owner,
        )

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

    def auth(self, user):
        res = self.client.post(
            "/api/login/",
            {"username": user.username, "password": self.password},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        access = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_member_can_list(self):
        self.auth(self.viewer)
        res = self.client.get(f"/api/tasks/{self.task.id}/memberships/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(len(res.data), 3)

    def test_owner_can_add_member(self):
        self.auth(self.owner)
        res = self.client.post(
            f"/api/tasks/{self.task.id}/memberships/",
            {"user_id": self.other.id, "role": UserTaskRole.ASSIGNED},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)

    def test_assigned_cannot_add_member(self):
        self.auth(self.assigned)
        res = self.client.post(
            f"/api/tasks/{self.task.id}/memberships/",
            {"user_id": self.other.id, "role": UserTaskRole.VIEWER},
            format="json",
        )
        self.assertIn(res.status_code, (403, 404), res.content)

    def test_owner_can_update_role(self):
        self.auth(self.owner)
        res = self.client.patch(
            f"/api/tasks/{self.task.id}/memberships/{self.assigned.id}/",
            {"role": UserTaskRole.VIEWER},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)

    def test_assigned_cannot_update_role(self):
        self.auth(self.assigned)
        res = self.client.patch(
            f"/api/tasks/{self.task.id}/memberships/{self.viewer.id}/",
            {"role": UserTaskRole.ASSIGNED},
            format="json",
        )
        self.assertIn(res.status_code, (403, 404), res.content)

    def test_owner_cannot_update_own_role(self):
        self.auth(self.owner)
        res = self.client.patch(
            f"/api/tasks/{self.task.id}/memberships/{self.owner.id}/",
            {"role": UserTaskRole.ASSIGNED},
            format="json",
        )
        self.assertEqual(res.status_code, 400, res.content)

    def test_owner_can_remove_member(self):
        self.auth(self.owner)
        res = self.client.delete(f"/api/tasks/{self.task.id}/memberships/{self.viewer.id}/")
        self.assertEqual(res.status_code, 204, res.content)

    def test_owner_cannot_remove_self(self):
        self.auth(self.owner)
        res = self.client.delete(f"/api/tasks/{self.task.id}/memberships/{self.owner.id}/")
        self.assertEqual(res.status_code, 400, res.content)

    def test_assigned_cannot_remove_member(self):
        self.auth(self.assigned)
        res = self.client.delete(f"/api/tasks/{self.task.id}/memberships/{self.viewer.id}/")
        self.assertIn(res.status_code, (403, 404), res.content)
