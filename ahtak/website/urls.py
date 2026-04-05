from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HeroSlideViewSet,
    SiteSettingsViewSet,
    TeamMemberViewSet,
    BlogCategoryViewSet,
    BlogTagViewSet,
    BlogPostViewSet,
    ContactMessageViewSet,
    SEOPageViewSet,
    HomePageContentViewSet,
    AboutPageContentViewSet,
    MembershipPageContentViewSet,
    ResourceViewSet,
    DownloadViewSet,
    JobViewSet,
    ProjectViewSet,
    GalleryAlbumViewSet,
)

router = DefaultRouter()
router.register(r"settings", SiteSettingsViewSet, basename="website-settings")
router.register(r"hero-slides", HeroSlideViewSet, basename="hero-slides")
router.register(r"team", TeamMemberViewSet, basename="team")
router.register(r"blog/categories", BlogCategoryViewSet, basename="blog-category")
router.register(r"blog/tags", BlogTagViewSet, basename="blog-tag")
router.register(r"blog/posts", BlogPostViewSet, basename="blog-post")
router.register(r"contact", ContactMessageViewSet, basename="contact")
router.register(r"seo", SEOPageViewSet, basename="seo")
router.register(r"home", HomePageContentViewSet, basename="home-content")
router.register(r"about-content", AboutPageContentViewSet, basename="about-content")
router.register(r"membership-content", MembershipPageContentViewSet, basename="membership-content")
router.register(r"resources", ResourceViewSet, basename="resource")
router.register(r"downloads", DownloadViewSet, basename="download")
router.register(r"jobs", JobViewSet, basename="job")
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"gallery", GalleryAlbumViewSet, basename="gallery-album")

urlpatterns = [
    path("", include(router.urls)),
]
