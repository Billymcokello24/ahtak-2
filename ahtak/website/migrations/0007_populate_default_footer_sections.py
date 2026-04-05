# Populate default footer sections

from django.db import migrations


def populate_footer_sections(apps, schema_editor):
    SiteSettings = apps.get_model("website", "SiteSettings")
    obj = SiteSettings.objects.filter(pk=1).first()
    if obj and (not obj.footer_sections or len(obj.footer_sections) == 0):
        obj.footer_sections = [
            {"title": "Quick Links", "links": [
                {"label": "Home", "url": "/"},
                {"label": "About", "url": "/about"},
                {"label": "Events", "url": "/events"},
                {"label": "Resources", "url": "/resources"},
                {"label": "Downloads", "url": "/downloads"},
                {"label": "Contact", "url": "/contact"},
            ]},
            {"title": "Membership", "links": [
                {"label": "Join Us", "url": "/register"},
                {"label": "Membership Info", "url": "/membership"},
                {"label": "CPD", "url": "/cpd"},
            ]},
            {"title": "Support", "links": [
                {"label": "Contact Us", "url": "/contact"},
                {"label": "Member Portal", "url": "/login"},
            ]},
        ]
        obj.save()


def reverse_populate(apps, schema_editor):
    SiteSettings = apps.get_model("website", "SiteSettings")
    obj = SiteSettings.objects.filter(pk=1).first()
    if obj:
        obj.footer_sections = []
        obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ("website", "0006_populate_default_announcements"),
    ]

    operations = [
        migrations.RunPython(populate_footer_sections, reverse_populate),
    ]
