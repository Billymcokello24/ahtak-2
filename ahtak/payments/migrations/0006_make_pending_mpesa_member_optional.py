from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0005_make_member_optional_on_payment"),
    ]

    operations = [
        migrations.AlterField(
            model_name="pendingmpesatransaction",
            name="member",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.CASCADE,
                related_name="pending_mpesa_transactions",
                to="members.member",
            ),
        ),
    ]
