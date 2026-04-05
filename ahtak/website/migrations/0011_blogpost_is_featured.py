# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("website", "0010_membership_page_fees_mpesa"),
    ]

    operations = [
        migrations.AddField(
            model_name="blogpost",
            name="is_featured",
            field=models.BooleanField(
                default=False,
                help_text="Highlight this post in the News page featured slot (one recommended).",
            ),
        ),
    ]
