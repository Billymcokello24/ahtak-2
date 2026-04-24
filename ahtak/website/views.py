"""Public website API views (read-only except contact + member registration)."""
import django_filters
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAdminUser, SAFE_METHODS
from rest_framework.response import Response
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
from .pagination import BlogPagination
from .serializers import (
    HeroSlideSerializer,
    SiteSettingsSerializer,
    TeamMemberSerializer,
    BlogCategorySerializer,
    BlogTagSerializer,
    BlogPostListSerializer,
    BlogPostDetailSerializer,
    ContactMessageSerializer,
    SEOPageSerializer,
    HomePageContentSerializer,
    AboutPageContentSerializer,
    MembershipPageContentSerializer,
    ResourceSerializer,
    DownloadSerializer,
    JobSerializer,
    ProjectSerializer,
    GalleryAlbumSerializer,
)


class SiteSettingsViewSet(viewsets.ModelViewSet):
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer

    def get_permissions(self):
        # allow read to anyone, write to admins only
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    def list(self, request):
        settings = SiteSettings.get_settings()
        return Response(SiteSettingsSerializer(settings).data)


class HeroSlideViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HeroSlide.objects.filter(is_active=True)
    serializer_class = HeroSlideSerializer
    permission_classes = [AllowAny]


class TeamMemberViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TeamMember.objects.filter(is_active=True)
    serializer_class = TeamMemberSerializer
    permission_classes = [AllowAny]


class BlogCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Full list (no pagination) so the public site can show all category chips."""
    queryset = BlogCategory.objects.all().order_by("name")
    serializer_class = BlogCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = None


class BlogTagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlogTag.objects.all().order_by("name")
    serializer_class = BlogTagSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = None


class BlogPostFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    tag = django_filters.CharFilter(field_name="tags__slug", lookup_expr="iexact")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = BlogPost
        fields = []  # category/tag/search are declared explicitly above

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(Q(title__icontains=value) | Q(excerpt__icontains=value))


class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BlogPostListSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = BlogPagination
    filterset_class = BlogPostFilter

    def get_queryset(self):
        qs = (
            BlogPost.objects.filter(status="published")
            .select_related("category", "author")
            .prefetch_related("tags")
        )
        if self.request.query_params.get("tag"):
            qs = qs.distinct()
        return qs

    def filter_queryset(self, queryset):
        qs = super().filter_queryset(queryset)
        raw = self.request.query_params.get("is_featured")
        if raw is not None and raw != "":
            v = str(raw).lower()
            if v in ("true", "1", "yes", "on"):
                qs = qs.filter(is_featured=True)
            elif v in ("false", "0", "no", "off"):
                qs = qs.filter(is_featured=False)
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BlogPostDetailSerializer
        return BlogPostListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=["views_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ContactMessageViewSet(viewsets.GenericViewSet):
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]

    def create(self, request):
        ser = ContactMessageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"detail": "Message sent successfully."}, status=status.HTTP_201_CREATED)


class HomePageContentViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        content = HomePageContent.get()
        return Response(HomePageContentSerializer(content).data)


class AboutPageContentViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        content = AboutPageContent.get()
        return Response(AboutPageContentSerializer(content).data)


class MembershipPageContentViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        content = MembershipPageContent.get()
        return Response(MembershipPageContentSerializer(content).data)


class ResourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Resource.objects.filter(is_active=True)
    serializer_class = ResourceSerializer
    permission_classes = [AllowAny]


class DownloadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Download.objects.filter(is_active=True)
    serializer_class = DownloadSerializer
    permission_classes = [AllowAny]


class JobViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Job.objects.filter(is_active=True)
    serializer_class = JobSerializer
    permission_classes = [AllowAny]


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Project.objects.filter(is_active=True)
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]


class GalleryAlbumViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GalleryAlbum.objects.filter(is_active=True).prefetch_related("media")
    serializer_class = GalleryAlbumSerializer
    permission_classes = [AllowAny]


class SEOPageViewSet(viewsets.ModelViewSet):
    queryset = SEOPage.objects.all()
    serializer_class = SEOPageSerializer
    lookup_field = "page_name"

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]
