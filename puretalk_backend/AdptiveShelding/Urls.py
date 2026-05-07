from django.urls import path
from .views import AnalyzeMessageView, UserHistoryView, BehaviorScoreView, AdminAllRecordsView

urlpatterns = [
    path("analyze/",        AnalyzeMessageView.as_view(), name="aesm-analyze"),
    path("history/",        UserHistoryView.as_view(),    name="aesm-history"),
    path("behavior-score/", BehaviorScoreView.as_view(),  name="aesm-behavior"),
    path("admin-records/",  AdminAllRecordsView.as_view(), name="aesm-admin-records"),
]