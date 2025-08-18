from django.contrib import admin
from .models import Profile, Post, Comment, Like, Follow, Notification

admin.site.register(Profile)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(Follow)
admin.site.register(Notification)
