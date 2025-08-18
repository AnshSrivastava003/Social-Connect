from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ProfileViewSet, PostViewSet, CommentViewSet,
    LikeViewSet, FollowViewSet, NotificationViewSet, AdminViewSet, feed_view
)
from .auth_views import (
    RegisterView, LoginView, LogoutView, ChangePasswordView,
    PasswordResetView, PasswordResetConfirmView, VerifyEmailView
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"profiles", ProfileViewSet, basename="profile")
router.register(r"posts", PostViewSet, basename="post")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"likes", LikeViewSet, basename="like")
router.register(r"follows", FollowViewSet, basename="follow")
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),

    # Auth (assignment)
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/verify/<uidb64>/<token>/", VerifyEmailView.as_view(), name="auth-verify-email"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("auth/password-reset/", PasswordResetView.as_view(), name="auth-password-reset"),
    path("auth/password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),

    # Feed
    path("feed/", feed_view, name="feed"),

    # Admin
    path("admin/users/", AdminViewSet.as_view({"get": "list_users"})),
    path("admin/users/<int:pk>/deactivate/", AdminViewSet.as_view({"post": "deactivate_user"})),
    path("admin/posts/", AdminViewSet.as_view({"get": "list_posts"})),
    path("admin/posts/<int:post_id>/", AdminViewSet.as_view({"delete": "delete_post"})),
    path("admin/stats/", AdminViewSet.as_view({"get": "stats"})),
]
