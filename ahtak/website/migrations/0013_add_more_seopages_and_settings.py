"""Add remaining SEOPage entries and ensure SiteSettings defaults exist.

This creates common pages the frontend requests (projects, gallery, jobs, blog, contact, register)
and ensures there's a `SiteSettings` row with sensible defaults so footer/nav endpoints return data.
"""
from django.db import migrations


def create_more(apps, schema_editor):
    SEOPage = apps.get_model('website', 'SEOPage')
    SiteSettings = apps.get_model('website', 'SiteSettings')

    more_pages = ['projects', 'gallery', 'jobs', 'blog', 'contact', 'register']
    for name in more_pages:
        SEOPage.objects.get_or_create(page_name=name)

    # Ensure site settings exist with basic nav/footer defaults if missing
    obj, created = SiteSettings.objects.get_or_create(pk=1)
    changed = False
    if not obj.nav_links:
        obj.nav_links = [
            {"label": "Home", "url": "/"},
            {"label": "About", "url": "/about"},
            {"label": "Membership", "url": "/membership"},
            {"label": "Events", "url": "/events"},
            {"label": "Resources", "url": "/resources"},
            {"label": "Projects", "url": "/projects"},
            {"label": "Blog", "url": "/blog"},
            {"label": "Contact", "url": "/contact"},
        ]
        changed = True
    if not obj.footer_sections:
        obj.footer_sections = [
            {"title": "Quick Links", "links": [{"label": "Home", "url": "/"}, {"label": "Contact", "url": "/contact"}]},
        ]
        changed = True
    if changed:
        obj.save()


def remove_more(apps, schema_editor):
    SEOPage = apps.get_model('website', 'SEOPage')
    SEOPage.objects.filter(page_name__in=['projects', 'gallery', 'jobs', 'blog', 'contact', 'register']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0012_add_default_seopages'),
    ]

    operations = [
        migrations.RunPython(create_more, remove_more),
    ]
