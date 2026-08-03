from django.urls import path
from .views import (
    AnalyzeMessageView,
    UserToxicityHistoryView,
    UserBehaviorScoreView,
    AdminAllRecordsView,
)

urlpatterns = [
    path("analyze/",        AnalyzeMessageView.as_view(),      name="aesm-analyze"),
    path("history/",        UserToxicityHistoryView.as_view(), name="aesm-history"),
    path("behavior-score/", UserBehaviorScoreView.as_view(),   name="aesm-behavior-score"),
    path("admin-records/",  AdminAllRecordsView.as_view(),     name="aesm-admin-records"),
]
