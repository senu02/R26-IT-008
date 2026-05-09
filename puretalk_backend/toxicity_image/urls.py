from django.urls import path
from .views import (
    ToxicImageDetectView,
    ToxicImageBatchDetectView,
    MyToxicityHistoryView,
    AllToxicityLogsView,
)

urlpatterns = [
    # Single image check
    path("detect/",        ToxicImageDetectView.as_view(),      name="toxic-detect"),

    # Batch image check (up to 10)
    path("detect/batch/",  ToxicImageBatchDetectView.as_view(), name="toxic-detect-batch"),

    # Current user's history
    path("history/",       MyToxicityHistoryView.as_view(),     name="toxic-history"),

    # Admin: all logs
    path("admin/logs/",    AllToxicityLogsView.as_view(),       name="toxic-admin-logs"),
]
