"""Website models: settings, team, blog, contact, SEO."""
import re
from django.db import models
from django.conf import settings


def team_photo_path(instance, filename):
    import uuid
    ext = filename[-4:] if '.' in filename else ''
    return f"website/team/{uuid.uuid4().hex[:8]}_{filename[:20]}{ext}"


def blog_image_path(instance, filename):
    ext = filename[-4:] if '.' in filename else ''
    return f"website/blog/{instance.slug or 'draft'}_{filename[:20]}{ext}"


def resource_file_path(instance, filename):
    import uuid
    ext = filename[-4:] if '.' in filename else ''
    return f"website/resources/{uuid.uuid4().hex[:8]}_{filename[:30]}{ext}"


def download_file_path(instance, filename):
    import uuid
    ext = filename[-4:] if '.' in filename else ''
    return f"website/downloads/{uuid.uuid4().hex[:8]}_{filename[:30]}{ext}"


def gallery_media_path(instance, filename):
    import uuid
    ext = filename[-4:] if '.' in filename else ''
    aid = instance.album_id or 0
    return f"website/gallery/album_{aid}/{uuid.uuid4().hex[:8]}{ext}"


def hero_slide_path(instance, filename):
    import uuid
    ext = filename[-4:] if '.' in filename else ''
    return f"website/hero/{uuid.uuid4().hex[:8]}_{filename[:30]}{ext}"


class SiteSettings(models.Model):
    """Global website settings (editable from admin)."""
    site_name = models.CharField(
        max_length=200,
        default="Animal Health Technicians and Technologists Association (AHTTAK)",
    )
    logo = models.ImageField(upload_to="website/settings/", null=True, blank=True)
    favicon = models.ImageField(upload_to="website/settings/", null=True, blank=True)
    phone_numbers = models.TextField(blank=True, help_text="One per line or comma-separated")
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    google_map_embed = models.TextField(blank=True, help_text="Google Maps iframe embed code")
    social_links = models.JSONField(default=dict, blank=True)  # {"facebook":"", "twitter":"", "linkedin":"", ...}
    tagline = models.CharField(max_length=200, blank=True, help_text="e.g. Upholding Professional Standards")
    announcements = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "Top ticker items. Supports either strings (legacy) or objects like: "
            '[{"text":"Welcome to AHTTAK","url":"/about"},{"text":"Download form","file":"/media/x.pdf"}]'
        ),
    )
    hero_slides = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "Home page hero carousel slides. "
            'Example: [{"image":"/media/hero.jpg","title":"Our Mandate","subtitle":"...","cta_label":"Learn More","cta_url":"/about"}]'
        ),
    )
    footer_sections = models.JSONField(
        default=list,
        blank=True,
        help_text='[{"title":"Quick Links","links":[{"label":"Payment","url":"/pay"}]},{"title":"Support","links":[]}]',
    )
    nav_links = models.JSONField(
        default=list,
        blank=True,
        help_text='[{"label":"Home","url":"/"},{"label":"About","url":"/about"},{"label":"Events","url":"/events"},{"label":"Contact","url":"/contact"},{"label":"Join Us","url":"/register"}]',
    )
    footer_links = models.JSONField(
        default=list,
        blank=True,
        help_text='Footer links. Leave empty to use same as nav. [{"label":"Home","url":"/"},...]',
    )
    opening_hours = models.TextField(blank=True)
    emergency_number = models.CharField(max_length=50, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self):
        return self.site_name

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(
            pk=1,
            defaults={"site_name": "Animal Health Technicians and Technologists Association (AHTTAK)"},
        )
        # Ensure runtime defaults for nav/footer so frontend sees expected links
        default_nav = [
            {"label": "Home", "url": "/"},
            {"label": "About", "url": "/about"},
            {"label": "Membership", "url": "/membership"},
            {"label": "CPD", "url": "/cpd"},
            {"label": "Events", "url": "/events"},
            {"label": "Resources", "url": "/resources"},
            {"label": "Downloads", "url": "/downloads"},
            {"label": "Jobs", "url": "/jobs"},
            {"label": "Projects", "url": "/projects"},
            {"label": "Gallery", "url": "/gallery"},
            {"label": "News", "url": "/blog"},
            {"label": "Contact", "url": "/contact"},
            {"label": "Join Us", "url": "/register"},
            {"label": "Sign In", "url": "/login"},
        ]
        changed = False
        # populate or merge nav_links
        if not obj.nav_links:
            obj.nav_links = default_nav.copy()
            changed = True
        else:
            existing_urls = {l.get('url') for l in obj.nav_links if isinstance(l, dict)}
            for item in default_nav:
                if item['url'] not in existing_urls:
                    obj.nav_links.append(item)
                    changed = True
        # ensure footer_links and footer_sections exist
        if not getattr(obj, 'footer_links', None):
            obj.footer_links = obj.nav_links
            changed = True
        if not getattr(obj, 'footer_sections', None):
            obj.footer_sections = [{"title": "Quick Links", "links": obj.nav_links}]
            changed = True
        if changed:
            obj.save()
        return obj


class HeroSlide(models.Model):
    """Home page hero carousel - upload images in admin."""
    image = models.ImageField(upload_to=hero_slide_path)
    title = models.CharField(max_length=200, blank=True, help_text="Optional - shown on slide")
    link_url = models.CharField(max_length=500, blank=True, help_text="Optional - 'Learn more' links here")
    link_label = models.CharField(max_length=100, blank=True, default="Learn more »")
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "created_at"]
        verbose_name = "Hero slide"
        verbose_name_plural = "Hero slides"

    def __str__(self):
        return self.title or f"Slide {self.id}"


class TeamMember(models.Model):
    """Board / team members for About page."""
    name = models.CharField(max_length=200)
    photo = models.ImageField(upload_to=team_photo_path, null=True, blank=True)
    designation = models.CharField(max_length=150)
    department = models.CharField(
        max_length=100,
        blank=True,
        help_text="Use 'Board', 'Management', 'Team', or 'Regional' to group on the About page.",
    )
    region = models.CharField(max_length=100, blank=True, help_text="Region if Regional representative")
    qualifications = models.CharField(max_length=300, blank=True)
    years_of_experience = models.PositiveIntegerField(null=True, blank=True)
    bio = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "name"]

    def __str__(self):
        return f"{self.name} ({self.designation})"


class BlogCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class BlogTag(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class BlogPost(models.Model):
    """Dynamic blog/articles."""
    STATUS_CHOICES = [("draft", "Draft"), ("published", "Published")]

    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True)
    featured_image = models.ImageField(upload_to=blog_image_path, null=True, blank=True)
    excerpt = models.TextField(blank=True)
    content = models.TextField()  # Rich text stored as HTML
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_posts"
    )
    category = models.ForeignKey(
        BlogCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts"
    )
    tags = models.ManyToManyField(BlogTag, related_name="posts", blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    is_featured = models.BooleanField(
        default=False,
        help_text="Highlight this post in the News page featured slot (one recommended).",
    )

    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    keywords = models.CharField(max_length=255, blank=True)

    views_count = models.PositiveIntegerField(default=0)
    reading_time_minutes = models.PositiveIntegerField(default=0, help_text="Auto-calculated if 0")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.reading_time_minutes and self.content:
            words = len(re.findall(r'\S+', self.content))
            self.reading_time_minutes = max(1, words // 200)
        super().save(*args, **kwargs)


class ContactMessage(models.Model):
    """Contact form submissions."""
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    responded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} from {self.email}"


class SEOPage(models.Model):
    """SEO per page - editable from admin without code."""
    page_name = models.CharField(max_length=100, unique=True)
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    keywords = models.CharField(max_length=255, blank=True)
    og_image = models.ImageField(upload_to="website/seo/", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.page_name


# ---- Page content (editable from admin) ----
class HomePageContent(models.Model):
    """Singleton: Chairperson message, intro, quick links."""
    chairperson_name = models.CharField(max_length=200, blank=True)
    chairperson_title = models.CharField(max_length=200, blank=True, default="Chairperson")
    chairperson_photo = models.ImageField(upload_to="website/home/", null=True, blank=True)
    chairperson_message = models.TextField(blank=True)
    intro_text = models.TextField(blank=True, help_text="Brief introduction to the association")
    quick_links = models.JSONField(
        default=list,
        blank=True,
        help_text='[{"label":"Membership","url":"/register"},{"label":"Events","url":"/events"}]',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Home Page Content"
        verbose_name_plural = "Home Page Content"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class AboutPageContent(models.Model):
    """Singleton: History, vision, mission, objectives."""
    history = models.TextField(blank=True)
    vision = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    core_values = models.TextField(blank=True, help_text="One per line or paragraph")
    objectives = models.TextField(blank=True)
    constitution_file = models.FileField(upload_to="website/about/", null=True, blank=True)
    governance_document = models.FileField(upload_to="website/about/", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "About Page Content"
        verbose_name_plural = "About Page Content"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class MembershipPageContent(models.Model):
    """Singleton: Membership info, eligibility, benefits, renewal."""
    intro_text = models.TextField(blank=True)
    eligibility = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    renewal_info = models.TextField(blank=True)
    # Public-facing fees & payment (editable in admin; consumed by website + home summary).
    registration_fee_kes = models.DecimalField(
        max_digits=12, decimal_places=2, default=1000, help_text="One-off registration (KES)."
    )
    retention_fee_kes_per_year = models.DecimalField(
        max_digits=12, decimal_places=2, default=1200, help_text="Annual retention (KES)."
    )
    retention_welfare_allocation_kes = models.DecimalField(
        max_digits=12, decimal_places=2, default=200, help_text="From retention to welfare (KES)."
    )
    student_membership_fee_kes = models.DecimalField(
        max_digits=12, decimal_places=2, default=500, help_text="Student category (KES)."
    )
    mpesa_paybill = models.CharField(
        max_length=32, default="400222", help_text="M-Pesa business number."
    )
    mpesa_account_format = models.CharField(
        max_length=200,
        default="354008#phone number",
        help_text="Account number format shown to members (e.g. 354008#phone number).",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Membership Page Content"
        verbose_name_plural = "Membership Page Content"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


# ---- Resources (guidelines, publications, links) ----
class Resource(models.Model):
    TYPE_CHOICES = [
        ("guideline", "Professional Guideline"),
        ("surveillance", "Disease Surveillance Update"),
        ("publication", "Publication/Research"),
        ("link", "External Link"),
    ]
    title = models.CharField(max_length=300)
    resource_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default="guideline")
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=resource_file_path, null=True, blank=True)
    external_url = models.URLField(blank=True, help_text="If link type, use this instead of file")
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title


# ---- Downloads (forms, reports, constitution) ----
class Download(models.Model):
    CATEGORY_CHOICES = [
        ("form", "Membership/Application Form"),
        ("plan", "Strategic Plan"),
        ("report", "Annual Report"),
        ("cpd", "CPD Guidelines"),
        ("constitution", "Constitution"),
        ("other", "Other"),
    ]
    title = models.CharField(max_length=300)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="other")
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=download_file_path)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title


# ---- Jobs & Opportunities ----
class Job(models.Model):
    TYPE_CHOICES = [
        ("job", "Job Listing"),
        ("internship", "Internship"),
        ("volunteer", "Volunteer Opportunity"),
        ("tender", "Tender / Project Call"),
    ]
    title = models.CharField(max_length=300)
    job_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="job")
    organization = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    application_deadline = models.DateField(null=True, blank=True)
    application_url = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "display_order"]

    def __str__(self):
        return self.title


# ---- Projects & Partnerships ----
class Project(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField()
    partners = models.TextField(blank=True, help_text="Collaborating organizations")
    project_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g. Training Initiative, Donor-supported, Community Program",
    )
    image = models.ImageField(upload_to="website/projects/", null=True, blank=True)
    external_url = models.URLField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title


# ---- Gallery ----
class GalleryAlbum(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="website/gallery/covers/", null=True, blank=True)
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gallery_albums",
    )
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "display_order"]

    def __str__(self):
        return self.title


class GalleryMedia(models.Model):
    MEDIA_TYPE_CHOICES = [("image", "Image"), ("video", "Video")]
    album = models.ForeignKey(
        GalleryAlbum,
        on_delete=models.CASCADE,
        related_name="media",
    )
    title = models.CharField(max_length=200, blank=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default="image")
    image = models.ImageField(upload_to=gallery_media_path, null=True, blank=True)
    video_url = models.URLField(blank=True, help_text="YouTube/Vimeo URL for video type")
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "created_at"]
        verbose_name_plural = "Gallery media"

    def __str__(self):
        return self.title or f"Media #{self.id}"
