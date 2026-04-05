"""Management command to backup SQLite database (and optionally media)."""
import os
import shutil
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Backup database and optionally media files to backup/ directory'

    def add_arguments(self, parser):
        parser.add_argument('--no-media', action='store_true', help='Skip media folder')
        parser.add_argument('--output', type=str, help='Custom output directory (default: backup/)')

    def handle(self, *args, **options):
        base_dir = Path(settings.BASE_DIR)
        out_dir = Path(options.get('output') or base_dir / 'backup')
        out_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # SQLite
        db = settings.DATABASES['default']
        if db['ENGINE'] == 'django.db.backends.sqlite3':
            src = Path(db['NAME'])
            if src.exists():
                dest = out_dir / f"db_{stamp}.sqlite3"
                shutil.copy2(src, dest)
                self.stdout.write(self.style.SUCCESS(f"Database backed up to {dest}"))
            else:
                self.stdout.write(self.style.WARNING("Database file not found"))
        else:
            self.stdout.write(self.style.WARNING("Only SQLite backup is supported by this command"))

        # Media
        if not options.get('no_media') and hasattr(settings, 'MEDIA_ROOT') and settings.MEDIA_ROOT:
            media_src = Path(settings.MEDIA_ROOT)
            if media_src.exists():
                media_dest = out_dir / f"media_{stamp}"
                shutil.copytree(media_src, media_dest, dirs_exist_ok=True)
                self.stdout.write(self.style.SUCCESS(f"Media backed up to {media_dest}"))
