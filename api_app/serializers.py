from rest_framework import serializers
from .models import Task, Subtask, UserTask
from django.contrib.auth import get_user_model

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    assigned_by = serializers.ReadOnlyField(source="assigned_by.username")
    current_user_role = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def get_current_user_role(self, obj):
        prefetched = getattr(obj, "current_user_memberships", None)
        if prefetched:
            return prefetched[0].role

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        membership = UserTask.objects.filter(task=obj, user=request.user).only("role").first()
        return membership.role if membership else None


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "task")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]
        

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class RegisterResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    access = serializers.CharField()
    refresh = serializers.CharField()


class ProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class UserTaskSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="user",
        write_only=True,
        required=False,
    )

    class Meta:
        model = UserTask
        fields = ["id", "task", "user", "user_id", "role"]
        read_only_fields = ("id", "task", "user")

    def validate(self, attrs):
        if self.instance is None and "user" not in attrs:
            raise serializers.ValidationError("user_id is required.")
        if self.instance is not None and "user" in attrs:
            raise serializers.ValidationError("Changing user is not allowed.")
        return attrs
        
