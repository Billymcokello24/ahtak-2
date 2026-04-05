"""
Seed the database with a super admin and optional sample data.

Uses environment variables for credentials (safe for dev):
  SEED_USERNAME  - default: admin
  SEED_PASSWORD  - default: admin123
  SEED_EMAIL     - default: admin@ahtak.local

Run: python manage.py seed_db
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with super admin and optional sample data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Use env/default credentials without prompting",
        )
        parser.add_argument(
            "--sample",
            action="store_true",
            help="Also create sample membership type and member",
        )

    def handle(self, *args, **options):
        username = os.environ.get("SEED_USERNAME", "admin")
        password = os.environ.get("SEED_PASSWORD", "admin123")
        email = os.environ.get("SEED_EMAIL", "admin@ahtak.local")

        if not options["no_input"]:
            self.stdout.write("Enter super admin credentials (or press Enter for defaults):")
            u = input(f"Username [{username}]: ").strip() or username
            p = input("Password [********]: ").strip() or password
            e = input(f"Email [{email}]: ").strip() or email
            username, password, email = u, p, e

        with transaction.atomic():
            user = User.objects.filter(username__iexact=username).first()
            created = user is None
            if created:
                user = User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                )
                self.stdout.write(self.style.SUCCESS(f"Created superuser: {username}"))
            else:
                user.set_password(password)
                user.save()
                self.stdout.write("Updated password for existing user.")
                user.is_staff = True
                user.is_superuser = True
                user.save(update_fields=["is_staff", "is_superuser"])
                self.stdout.write(self.style.WARNING(f"Superuser '{username}' already exists."))

            # Ensure UserProfile exists and is super_admin
            from core.models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"role": "super_admin"})
            if profile.role != "super_admin":
                profile.role = "super_admin"
                profile.save()
                self.stdout.write("Set role to super_admin.")

            if options["sample"]:
                self._seed_sample_data()

        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write(f"Login at http://localhost:5173 or /admin/ with: {username} / [your password]")

    def _seed_sample_data(self):
        from members.models import MembershipType
        from decimal import Decimal

        mt, _ = MembershipType.objects.get_or_create(
            code="REG",
            defaults={
                "name": "Regular Membership",
                "kind": "regular",
                "annual_fee": Decimal("1000.00"),
                "registration_fee": Decimal("500.00"),
                "validity_months": 12,
                "has_voting_rights": True,
                "loan_eligible": True,
            }
        )
        if _:
            self.stdout.write("Created sample membership type: Regular")
        self.stdout.write("Sample data done.")
