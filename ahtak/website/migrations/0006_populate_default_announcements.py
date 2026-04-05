# Generated - populate default announcements

from django.db import migrations


def populate_announcements(apps, schema_editor):
    SiteSettings = apps.get_model("website", "SiteSettings")
    obj = SiteSettings.objects.filter(pk=1).first()
    if obj and (not obj.announcements or len(obj.announcements) == 0):
        obj.announcements = [
            "Welcome to Animal Health Technicians and Technologists Association (AHTTAK)",
        ]
        obj.tagline = obj.tagline or "Upholding Professional Standards"
        obj.save()


def reverse_populate(apps, schema_editor):
    SiteSettings = apps.get_model("website", "SiteSettings")
    obj = SiteSettings.objects.filter(pk=1).first()
    if obj:
        obj.announcements = []
        obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ("website", "0005_add_announcements_tagline_footer_sections"),
    ]

    operations = [
        migrations.RunPython(populate_announcements, reverse_populate),
    ]
