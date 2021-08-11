from django.urls import path, include
from .views import AppointmentList, AppointmentDetail, InsuranceProviderList, PatientList, PatientDetail, PingView, ProgressNoteList, ProgressNoteDetail, AllergyList, MedicationList, DiagnosisList

urlpatterns = [
    path('ping', PingView.as_view()),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.authtoken')),
    path('appointments', AppointmentList.as_view()),
    path('appointments/<int:pk>', AppointmentDetail.as_view()),
    path('patients', PatientList.as_view()),
    path('patients/<int:pk>', PatientDetail.as_view()),
    path('insurance_providers', InsuranceProviderList.as_view()),
    path('progress_notes', ProgressNoteList.as_view()),
    path('progress_notes/<int:pk>', ProgressNoteDetail.as_view()),
    path('allergies', AllergyList.as_view()),
    path('medication', MedicationList.as_view()),
    path('diagnoses', DiagnosisList.as_view()),
]
