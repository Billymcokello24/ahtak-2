"""Create default SEOPage rows for public pages used by frontend.

This ensures endpoints like /api/public/seo/events/ return 200 instead of 404
when the admin hasn't added the entry yet.
"""
from django.db import migrations


def create_seopages(apps, schema_editor):
    SEOPage = apps.get_model('website', 'SEOPage')
    page_names = [
        'home',
        'about',
        'membership',
        'cpd',
        'events',
        'resources',
        'downloads',
    ]
    for name in page_names:
        SEOPage.objects.get_or_create(page_name=name)


def remove_seopages(apps, schema_editor):
    SEOPage = apps.get_model('website', 'SEOPage')
    page_names = [
        'home',
        'about',
        'membership',
        'cpd',
        'events',
        'resources',
        'downloads',
    ]
    SEOPage.objects.filter(page_name__in=page_names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0011_blogpost_is_featured'),
    ]

    operations = [
        migrations.RunPython(create_seopages, remove_seopages),
    ]
