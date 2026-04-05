from django.urls import path
from . import views

urlpatterns = [
    path('', views.report_list),
    path('members/excel/', views.report_members_excel),
    path('payments/excel/', views.report_payments_excel),
    path('summary/pdf/', views.report_summary_pdf),
]
