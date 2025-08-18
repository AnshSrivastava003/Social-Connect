from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Follow, Like, Comment, Notification, Profile, Post

@receiver(post_save, sender=Follow)
def notif_follow(sender, instance, created, **kwargs):
    if created and instance.follower != instance.following:
        Notification.objects.create(
            recipient=instance.following,
            sender=instance.follower,
            notification_type="follow",
            message=f"{instance.follower.username} started following you",
        )
        # counts
        try:
            p_following = Profile.objects.get(user=instance.following)
            p_follower = Profile.objects.get(user=instance.follower)
            p_following.followers_count += 1
            p_following.save()
            p_follower.following_count += 1
            p_follower.save()
        except Profile.DoesNotExist:
            pass

@receiver(post_delete, sender=Follow)
def update_counts_unfollow(sender, instance, **kwargs):
    try:
        p_following = Profile.objects.get(user=instance.following)
        p_follower = Profile.objects.get(user=instance.follower)
        p_following.followers_count = max(0, p_following.followers_count - 1)
        p_following.save()
        p_follower.following_count = max(0, p_follower.following_count - 1)
        p_follower.save()
    except Profile.DoesNotExist:
        pass

@receiver(post_save, sender=Like)
def notif_like(sender, instance, created, **kwargs):
    if created and instance.user != instance.post.author:
        Notification.objects.create(
            recipient=instance.post.author,
            sender=instance.user,
            notification_type="like",
            post=instance.post,
            message=f"{instance.user.username} liked your post",
        )
        Post.objects.filter(pk=instance.post_id).update(like_count=instance.post.likes.count())

@receiver(post_delete, sender=Like)
def decr_like(sender, instance, **kwargs):
    Post.objects.filter(pk=instance.post_id).update(like_count=max(0, instance.post.likes.count()))

@receiver(post_save, sender=Comment)
def notif_comment(sender, instance, created, **kwargs):
    if created:
        Post.objects.filter(pk=instance.post_id).update(comment_count=instance.post.comments.count())
        if instance.author != instance.post.author:
            Notification.objects.create(
                recipient=instance.post.author,
                sender=instance.author,
                notification_type="comment",
                post=instance.post,
                message=f"{instance.author.username} commented on your post",
            )
