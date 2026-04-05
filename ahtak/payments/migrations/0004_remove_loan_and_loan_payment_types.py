# Remove loan FK and loan-related payment types (organization does not offer loans)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_add_pending_mpesa'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payment',
            name='payment_type',
            field=models.CharField(
                choices=[
                    ('registration', 'Registration Fee'),
                    ('membership', 'Membership Fee'),
                    ('renewal', 'Membership Renewal'),
                    ('event', 'Event Registration Fee'),
                    ('savings_deposit', 'Savings Deposit'),
                    ('savings_withdrawal', 'Savings Withdrawal'),
                    ('share_purchase', 'Share Capital Purchase'),
                    ('share_redemption', 'Share Redemption'),
                    ('contribution', 'Monthly Contribution'),
                    ('penalty', 'Penalty/Fine'),
                    ('other', 'Other'),
                ],
                max_length=50,
            ),
        ),
    ]
