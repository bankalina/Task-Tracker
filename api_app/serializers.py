from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_by = serializers.ReadOnlyField(source="assigned_by.username")

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")
