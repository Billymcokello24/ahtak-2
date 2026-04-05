import logging

from django.core.cache import cache
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from website.models import BlogPost

logger = logging.getLogger(__name__)

CONTENT_NOTIFY_THROTTLE_SEC = 3600


def _schedule_notify(task_fn, *args):
    try:
        task_fn.delay(*args)
    except Exception as exc:
        logger.warning("Celery delay failed for %s (%s); running synchronously", task_fn.__name__, exc)
        task_fn(*args)


@receiver(pre_save, sender=BlogPost)
def blog_content_notify_presave(sender, instance, raw=False, **kwargs):
    if raw:
        return
    if not instance.pk:
        instance._content_notify_prev_status = None
        return
    try:
        old = BlogPost.objects.only("status").get(pk=instance.pk)
        instance._content_notify_prev_status = old.status
    except BlogPost.DoesNotExist:
        instance._content_notify_prev_status = None


@receiver(post_save, sender=BlogPost)
def blog_content_notify_postsave(sender, instance, created, raw=False, **kwargs):
    if raw:
        return
    if instance.status != "published":
        return
    prev = getattr(instance, "_content_notify_prev_status", None)
    from notifications.tasks import notify_members_blog_post

    reason = None
    if created:
        reason = "new"
    elif prev == "draft" and instance.status == "published":
        reason = "new"
    elif prev == "published":
        key = f"content_notify:blog:{instance.pk}"
        if cache.add(key, 1, timeout=CONTENT_NOTIFY_THROTTLE_SEC):
            reason = "update"
    if reason:
        _schedule_notify(notify_members_blog_post, instance.pk, reason)
