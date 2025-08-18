from django.utils import timezone
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import Profile, Post, Comment, Like, Follow, Notification
from .serializers import (
    UserSerializer, ProfileSerializer, PostSerializer, CommentSerializer,
    LikeSerializer, FollowSerializer, NotificationSerializer
)
from .permissions import IsOwnerOrReadOnly

# ---- Users & Profiles ----
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["get", "put", "patch"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """GET = my profile, PUT/PATCH = update own profile"""
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if request.method in ("PUT", "PATCH"):
            ser = ProfileSerializer(profile, data=request.data, partial=True)
            ser.is_valid(raise_exception=True)
            ser.save()
            return Response(ser.data)
        return Response(ProfileSerializer(profile).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="follow")
    def follow_user(self, request, pk=None):
        target = self.get_object()
        if target == request.user:
            return Response({"detail": "Cannot follow yourself."}, status=400)
        Follow.objects.get_or_create(follower=request.user, following=target)
        return Response({"followed": True})

    @follow_user.mapping.delete
    def unfollow_user(self, request, pk=None):
        target = self.get_object()
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response({"unfollowed": True})

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny], url_path="followers")
    def followers(self, request, pk=None):
        u = self.get_object()
        qs = Follow.objects.filter(following=u).order_by("-created_at")
        data = [{"id": f.follower.id, "username": f.follower.username} for f in qs]
        return Response(data)

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny], url_path="following")
    def following(self, request, pk=None):
        u = self.get_object()
        qs = Follow.objects.filter(follower=u).order_by("-created_at")
        data = [{"id": f.following.id, "username": f.following.username} for f in qs]
        return Response(data)

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related("user").all()
    serializer_class = ProfileSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# ---- Posts ----
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_active=True).order_by("-created_at")
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        post = serializer.save(author=self.request.user)
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        profile.posts_count += 1
        profile.save()

    # Spec: like/unlike/like-status under /api/posts/{id}/like/
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="like")
    def like(self, request, pk=None):
        post = self.get_object()
        Like.objects.get_or_create(user=request.user, post=post)
        return Response({"liked": True})

    @like.mapping.delete
    def unlike(self, request, pk=None):
        post = self.get_object()
        Like.objects.filter(user=request.user, post=post).delete()
        return Response({"unliked": True})

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated], url_path="like-status")
    def like_status(self, request, pk=None):
        post = self.get_object()
        liked = Like.objects.filter(user=request.user, post=post).exists()
        return Response({"liked": liked})

    # Spec: comments nested under a post
    @action(detail=True, methods=["get", "post"], permission_classes=[IsAuthenticatedOrReadOnly], url_path="comments")
    def comments_under_post(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            ser = CommentSerializer(post.comments.filter(is_active=True).order_by("-created_at"), many=True)
            return Response(ser.data)
        # POST
        ser = CommentSerializer(data={"post": post.id, **request.data})
        ser.is_valid(raise_exception=True)
        obj = ser.save(author=request.user)
        return Response(CommentSerializer(obj).data, status=201)

# ---- Comments (for delete own comment) ----
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(is_active=True).order_by("-created_at")
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

# ---- Likes (read-only listing if needed) ----
class LikeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Like.objects.all().order_by("-created_at")
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# ---- Follows ----
class FollowViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Follow.objects.all().order_by("-created_at")
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# ---- Notifications ----
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by("-created_at")
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        n = self.get_object()
        n.is_read = True
        n.save(update_fields=["is_read"])
        return Response({"read": True})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"marked_all_read": True})

# ---- Feed ----
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def feed_view(request):
    user = request.user
    following_ids = Follow.objects.filter(follower=user).values_list("following_id", flat=True)
    posts = Post.objects.filter(Q(author=user) | Q(author_id__in=following_ids), is_active=True).order_by("-created_at")
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(posts, request)
    ser = PostSerializer(page, many=True)
    return paginator.get_paginated_response(ser.data)

# ---- Admin ----
from rest_framework.viewsets import ViewSet

class AdminViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def list_users(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Not authorized"}, status=403)
        users = User.objects.all()
        return Response(UserSerializer(users, many=True).data)

    def deactivate_user(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Not authorized"}, status=403)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)
        user.is_active = False
        user.save()
        return Response({"message": "User deactivated"})

    def list_posts(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Not authorized"}, status=403)
        posts = Post.objects.all()
        return Response(PostSerializer(posts, many=True).data)

    @action(detail=False, methods=["delete"], url_path="posts/(?P<post_id>[^/.]+)")
    def delete_post(self, request, post_id=None):
        if not request.user.is_staff:
            return Response({"detail": "Not authorized"}, status=403)
        try:
            Post.objects.get(pk=post_id).delete()
            return Response(status=204)
        except Post.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

    def stats(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Not authorized"}, status=403)
        today = timezone.now().date()
        total_users = User.objects.count()
        total_posts = Post.objects.count()
        active_today = Post.objects.filter(created_at__date=today).count()
        return Response({"total_users": total_users, "total_posts": total_posts, "active_today": active_today})
