"""Serializers for public website API."""
from rest_framework import serializers
from .models import (
    SiteSettings,
    HeroSlide,
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


class HeroSlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroSlide
        fields = ["id", "image", "title", "link_url", "link_label", "display_order"]


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "site_name", "logo", "favicon", "tagline",
            "phone_numbers", "email", "address",
            "google_map_embed", "social_links",
            "announcements", "hero_slides", "footer_sections",
            "nav_links", "footer_links",
            "opening_hours", "emergency_number",
        ]


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = [
            "id", "name", "photo", "designation",
            "department", "region", "qualifications", "years_of_experience",
            "bio", "display_order",
        ]


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ["id", "name", "slug", "description"]


class BlogTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ["id", "name", "slug"]


class BlogPostListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True, allow_null=True)
    tags = BlogTagSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "featured_image", "excerpt",
            "category", "category_name", "category_slug", "tags", "status",
            "is_featured", "author_name",
            "reading_time_minutes", "views_count",
            "published_at", "created_at",
        ]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return ""


class BlogPostDetailSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    tags = BlogTagSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()
    related_posts = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "featured_image", "excerpt", "content",
            "author", "author_name", "category", "tags",
            "related_posts",
            "meta_title", "meta_description", "keywords",
            "reading_time_minutes", "views_count",
            "published_at", "created_at", "updated_at",
        ]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username if obj.author else ""

    def get_related_posts(self, obj):
        qs = (
            BlogPost.objects.filter(status="published")
            .exclude(pk=obj.pk)
            .select_related("category", "author")
            .prefetch_related("tags")
        )
        if obj.category_id:
            same = qs.filter(category_id=obj.category_id).order_by("-published_at", "-created_at")
            if same.count() >= 3:
                return BlogPostListSerializer(same[:3], many=True, context=self.context).data
        tag_ids = list(obj.tags.values_list("id", flat=True))
        if tag_ids:
            tagged = (
                qs.filter(tags__in=tag_ids)
                .distinct()
                .order_by("-published_at", "-created_at")[:3]
            )
            if tagged:
                return BlogPostListSerializer(tagged, many=True, context=self.context).data
        fallback = qs.order_by("-published_at", "-created_at")[:3]
        return BlogPostListSerializer(fallback, many=True, context=self.context).data


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["name", "email", "phone", "subject", "message"]


class SEOPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOPage
        fields = ["page_name", "meta_title", "meta_description", "keywords", "og_image"]


class HomePageContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomePageContent
        fields = [
            "chairperson_name", "chairperson_title", "chairperson_photo",
            "chairperson_message", "intro_text", "quick_links", "updated_at",
        ]


class AboutPageContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPageContent
        fields = [
            "history", "vision", "mission", "core_values", "objectives",
            "constitution_file", "governance_document", "updated_at",
        ]


class MembershipPageContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPageContent
        fields = [
            "intro_text",
            "eligibility",
            "requirements",
            "benefits",
            "renewal_info",
            "registration_fee_kes",
            "retention_fee_kes_per_year",
            "retention_welfare_allocation_kes",
            "student_membership_fee_kes",
            "mpesa_paybill",
            "mpesa_account_format",
            "updated_at",
        ]


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = [
            "id", "title", "resource_type", "description",
            "file", "external_url", "display_order", "created_at",
        ]


class DownloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Download
        fields = [
            "id", "title", "category", "description",
            "file", "display_order", "created_at",
        ]


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id", "title", "job_type", "organization", "description",
            "requirements", "location", "application_deadline",
            "application_url", "contact_email", "created_at",
        ]


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id", "title", "description", "partners", "project_type",
            "image", "external_url", "start_date", "end_date", "created_at",
        ]


class GalleryMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryMedia
        fields = ["id", "title", "media_type", "image", "video_url", "display_order", "created_at"]


class GalleryAlbumSerializer(serializers.ModelSerializer):
    media = GalleryMediaSerializer(many=True, read_only=True)
    media_count = serializers.SerializerMethodField()

    class Meta:
        model = GalleryAlbum
        fields = ["id", "title", "description", "cover_image", "event", "media", "media_count", "created_at"]

    def get_media_count(self, obj):
        return obj.media.count()
