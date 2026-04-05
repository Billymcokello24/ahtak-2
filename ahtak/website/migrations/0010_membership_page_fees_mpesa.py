# Generated manually for MembershipPageContent fee & M-Pesa fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("website", "0009_add_hero_slide_model"),
    ]

    operations = [
        migrations.AddField(
            model_name="membershippagecontent",
            name="registration_fee_kes",
            field=models.DecimalField(
                decimal_places=2,
                default=1000,
                help_text="One-off registration (KES).",
                max_digits=12,
            ),
        ),
        migrations.AddField(
            model_name="membershippagecontent",
            name="retention_fee_kes_per_year",
            field=models.DecimalField(
                decimal_places=2,
                default=1200,
                help_text="Annual retention (KES).",
                max_digits=12,
            ),
        ),
        migrations.AddField(
            model_name="membershippagecontent",
            name="retention_welfare_allocation_kes",
            field=models.DecimalField(
                decimal_places=2,
                default=200,
                help_text="From retention to welfare (KES).",
                max_digits=12,
            ),
        ),
        migrations.AddField(
            model_name="membershippagecontent",
            name="student_membership_fee_kes",
            field=models.DecimalField(
                decimal_places=2,
                default=500,
                help_text="Student category (KES).",
                max_digits=12,
            ),
        ),
        migrations.AddField(
            model_name="membershippagecontent",
            name="mpesa_paybill",
            field=models.CharField(
                default="400222",
                help_text="M-Pesa business number.",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="membershippagecontent",
            name="mpesa_account_format",
            field=models.CharField(
                default="354008#phone number",
                help_text="Account number format shown to members (e.g. 354008#phone number).",
                max_length=200,
            ),
        ),
    ]
