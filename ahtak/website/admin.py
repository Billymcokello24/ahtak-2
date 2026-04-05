"""Admin for website models."""
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.html import format_html
from core.admin import DateTimePickerMixin
from .models import (
    HeroSlide,
    SiteSettings,
    TeamMember,
    BlogCategory,
    BlogTag,
    BlogPost,
    ContactMessage,
    SEOPage,
    HomePageContent,
    AboutPageContent,
    MembershipPageContent,
    Resource,
    Download,
    Job,
    Project,
    GalleryAlbum,
    GalleryMedia,
)


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "display_order", "is_active", "created_at"]
    list_editable = ["display_order", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["title"]
    ordering = ["display_order", "created_at"]


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["site_name", "email", "updated_at"]
    fieldsets = [
        (None, {"fields": ["site_name", "tagline", "logo", "favicon"]}),
        ("Announcements", {"fields": ["announcements"], "description": "Top ticker items. JSON array of strings OR objects: [{\"text\":\"Notice\",\"url\":\"/about\"}] or [{\"text\":\"PDF\",\"file\":\"/media/x.pdf\"}]"}),
        ("Home Hero (legacy JSON)", {"fields": ["hero_slides"], "description": "Use Hero Slides in the menu above to upload images. This field is a fallback."}),
        ("Contact", {"fields": ["phone_numbers", "email", "address", "emergency_number", "opening_hours"]}),
        ("Navigation", {"fields": ["nav_links", "footer_links"], "description": "JSON: [{\"label\":\"Home\",\"url\":\"/\"}]"}),
        ("Footer Sections", {"fields": ["footer_sections"], "description": "Multi-column footer. [{\"title\":\"Quick Links\",\"links\":[{\"label\":\"Payment\",\"url\":\"/pay\"}]}]"}),
        ("Map & Social", {"fields": ["google_map_embed", "social_links"]}),
    ]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ["name", "designation", "department", "display_order", "is_active"]
    list_editable = ["display_order", "is_active"]
    list_filter = ["department", "is_active"]
    search_fields = ["name", "designation", "bio"]


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(BlogPost)
class BlogPostAdmin(DateTimePickerMixin, admin.ModelAdmin):
    list_display = ["title", "category", "is_featured", "status", "views_count", "published_at", "created_at"]
    list_filter = ["status", "category", "is_featured"]
    list_editable = ["status", "is_featured"]
    search_fields = ["title", "excerpt", "content"]
    prepopulated_fields = {"slug": ["title"]}
    filter_horizontal = ["tags"]
    readonly_fields = ["views_count", "reading_time_minutes", "created_at", "updated_at"]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["subject", "name", "email", "responded", "created_at"]
    list_filter = ["responded"]
    list_editable = ["responded"]
    search_fields = ["name", "email", "subject", "message"]
    readonly_fields = ["name", "email", "phone", "subject", "message", "created_at"]


@admin.register(SEOPage)
class SEOPageAdmin(admin.ModelAdmin):
    list_display = ["page_name", "meta_title", "updated_at"]


@admin.register(HomePageContent)
class HomePageContentAdmin(admin.ModelAdmin):
    list_display = ["chairperson_name", "updated_at"]

    def changelist_view(self, request, extra_context=None):
        # Singleton UX: menu click goes straight to edit screen.
        obj = HomePageContent.get()
        url = reverse(f"admin:{obj._meta.app_label}_{obj._meta.model_name}_change", args=[obj.pk])
        return redirect(url)

    def has_add_permission(self, request):
        return not HomePageContent.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(AboutPageContent)
class AboutPageContentAdmin(admin.ModelAdmin):
    list_display = ["updated_at"]

    def changelist_view(self, request, extra_context=None):
        obj = AboutPageContent.get()
        url = reverse(f"admin:{obj._meta.app_label}_{obj._meta.model_name}_change", args=[obj.pk])
        return redirect(url)

    def has_add_permission(self, request):
        return not AboutPageContent.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(MembershipPageContent)
class MembershipPageContentAdmin(admin.ModelAdmin):
    list_display = ["updated_at"]
    readonly_fields = ["live_fee_statistics"]

    fieldsets = (
        (
            "Recorded payments (live)",
            {
                "fields": ("live_fee_statistics",),
                "description": "Counts and totals from the Payments module. "
                "Registration = payment type “registration”. Retention = “membership” + “renewal”. "
                "Welfare = sum over retention receipts: amount × (welfare allocation ÷ retention fee) using the fee fields below.",
            },
        ),
        (
            "Page content",
            {
                "fields": (
                    "intro_text",
                    "eligibility",
                    "requirements",
                    "benefits",
                    "renewal_info",
                )
            },
        ),
        (
            "Fees & M-Pesa (public website)",
            {
                "fields": (
                    "registration_fee_kes",
                    "retention_fee_kes_per_year",
                    "retention_welfare_allocation_kes",
                    "student_membership_fee_kes",
                    "mpesa_paybill",
                    "mpesa_account_format",
                ),
                "description": "Shown on the Membership page and the home page fee summary. "
                "Keep values aligned with official resolutions.",
            },
        ),
    )

    @admin.display(description="Membership fee collections summary")
    def live_fee_statistics(self, obj):
        from payments.stats import get_membership_fee_stats

        s = get_membership_fee_stats()
        reg = s["registration_fee"]
        ret = s["retention_fee"]
        wf = s["welfare_from_retention"]
        st = s["student_membership"]
        ref = s["reference_fees_kes"]
        return format_html(
            "<table class='table' style='width:100%;max-width:44rem'>"
            "<thead><tr><th>Category</th><th>Members (distinct)</th><th>Receipts</th><th>Total (KES)</th></tr></thead>"
            "<tbody>"
            "<tr><td>Registration fee</td><td>{}</td><td>{}</td><td>{:,.0f}</td></tr>"
            "<tr><td>Retention (membership + renewal)</td><td>{}</td><td>{}</td><td>{:,.0f}</td></tr>"
            "<tr><td>Welfare (from retention, estimated)</td><td>—</td><td>{}</td><td>{:,.0f}</td></tr>"
            "<tr><td>Student (reg + membership + renewal)</td><td>{}</td><td>{}</td><td>{:,.0f}</td></tr>"
            "</tbody></table>"
            "<p style='margin-top:1rem'><strong>Reference amounts on this page:</strong> "
            "Registration {:,.0f} · Retention/year {:,.0f} · Welfare share {:,.0f} · Student {:,.0f} KES</p>"
            "<p style='font-size:12px;color:#666'>{}</p>",
            reg["members_paid_count"],
            reg["receipts_count"],
            reg["total_kes"],
            ret["members_paid_count"],
            ret["receipts_count"],
            ret["total_kes"],
            ret["receipts_count"],
            wf["estimated_total_kes"],
            st["members_paid_count"],
            st["receipts_count"],
            st["total_kes"],
            ref["registration"],
            ref["retention_per_year"],
            ref["welfare_allocation_per_retention"],
            ref["student_membership"],
            wf["note"],
        )

    def changelist_view(self, request, extra_context=None):
        obj = MembershipPageContent.get()
        url = reverse(f"admin:{obj._meta.app_label}_{obj._meta.model_name}_change", args=[obj.pk])
        return redirect(url)

    def has_add_permission(self, request):
        return not MembershipPageContent.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ["title", "resource_type", "display_order", "is_active", "created_at"]
    list_filter = ["resource_type", "is_active"]
    list_editable = ["display_order", "is_active"]
    search_fields = ["title", "description"]


@admin.register(Download)
class DownloadAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "display_order", "is_active", "created_at"]
    list_filter = ["category", "is_active"]
    list_editable = ["display_order", "is_active"]
    search_fields = ["title", "description"]


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ["title", "job_type", "organization", "application_deadline", "is_active", "created_at"]
    list_filter = ["job_type", "is_active"]
    list_editable = ["is_active"]
    search_fields = ["title", "organization", "description"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "project_type", "display_order", "is_active", "created_at"]
    list_filter = ["is_active"]
    list_editable = ["display_order", "is_active"]
    search_fields = ["title", "description", "partners"]


class GalleryMediaInline(admin.TabularInline):
    model = GalleryMedia
    extra = 1
    fields = ["title", "media_type", "image", "video_url", "display_order"]


@admin.register(GalleryAlbum)
class GalleryAlbumAdmin(admin.ModelAdmin):
    list_display = ["title", "event", "display_order", "is_active", "created_at"]
    list_filter = ["is_active"]
    list_editable = ["display_order", "is_active"]
    inlines = [GalleryMediaInline]
    search_fields = ["title", "description"]
