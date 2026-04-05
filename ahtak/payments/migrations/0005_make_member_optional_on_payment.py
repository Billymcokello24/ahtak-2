from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0004_remove_loan_and_loan_payment_types"),
    ]

    operations = [
        migrations.AlterField(
            model_name="payment",
            name="member",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.CASCADE,
                related_name="payments",
                to="members.member",
            ),
        ),
    ]
