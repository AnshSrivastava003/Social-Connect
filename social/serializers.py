import re
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Post, Comment, Like, Notification, Follow

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")

# -------- Auth & User --------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "first_name", "last_name")

    def validate_username(self, v):
        if not USERNAME_RE.match(v or ""):
            raise serializers.ValidationError("Username must be 3–30 chars, alphanumeric or underscore.")
        return v

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if User.objects.filter(username=attrs.get("username")).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        if User.objects.filter(email__iexact=attrs.get("email")).exists():
            raise serializers.ValidationError({"email": "Email already in use."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2", None)
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data, is_active=False)  # inactive until email verify
        user.set_password(password)
        user.save()
        Profile.objects.get_or_create(user=user)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "last_login", "date_joined"]

# -------- Profile --------
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Profile
        fields = ["user", "bio", "avatar_url", "website", "location", "visibility",
                  "followers_count", "following_count", "posts_count"]

# -------- Post / Comment / Like --------
def validate_image_url(url: str):
    if not url:
        return url
    url_l = url.lower()
    if not (url_l.endswith(".jpg") or url_l.endswith(".jpeg") or url_l.endswith(".png")):
        raise serializers.ValidationError("Only JPG/PNG images are allowed.")
    return url

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Post
        fields = ["id", "author", "content", "image_url", "category", "is_active",
                  "like_count", "comment_count", "created_at", "updated_at"]

    def validate_image_url(self, v):
        return validate_image_url(v)

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all())

    class Meta:
        model = Comment
        fields = ["id", "author", "post", "content", "is_active", "created_at"]

class LikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all())

    class Meta:
        model = Like
        fields = ["id", "user", "post", "created_at"]

# -------- Follow / Notification --------
class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ["id", "follower", "following", "created_at"]

class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    sender = UserSerializer(read_only=True)
    # keep post minimal to reduce payload
    post = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "recipient", "sender", "notification_type", "post",
                  "message", "is_read", "created_at"]
