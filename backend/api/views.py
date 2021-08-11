from django_filters import rest_framework as filters
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import generics, permissions
from .serializers import AppointmentSerializer, InsuranceProviderSerializer, PatientSerializer, ProgressNoteSerializer, AllergySerializer, MedicationSerializer, DiagnosisSerializer
from .models import Appointment, InsuranceProvider, Patient, ProgressNote, Allergy, Medication, Diagnosis
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView


# Create your views here.
class PingView(APIView):
    renderer_classes = [JSONRenderer]

    def get(self, request, format=None):
        return Response({'message': 'pong'})


class InsuranceProviderList(generics.ListCreateAPIView):
    queryset = InsuranceProvider.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InsuranceProviderSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']


class PatientList(generics.ListCreateAPIView):
    queryset = Patient.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PatientSerializer
    filter_backends = [SearchFilter]
    search_fields = ['$dob', 'first_name', 'last_name', 'email']


class PatientDetail(generics.RetrieveUpdateAPIView):
    queryset = Patient.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PatientSerializer


class AppointmentFilter(filters.FilterSet):
    start = filters.DateFromToRangeFilter()

    class Meta:
        model = Appointment
        fields = ['id', 'start', 'patient']


class AppointmentList(generics.ListCreateAPIView):
    queryset = Appointment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer
    filter_backends = [filters.DjangoFilterBackend, OrderingFilter]
    filterset_class = AppointmentFilter
    ordering_fields = ['start']


class AppointmentDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer


class ProgressNoteList(generics.ListCreateAPIView):
    queryset = ProgressNote.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProgressNoteSerializer
    filter_backends = [filters.DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['patient']
    ordering_fields = ['id']


class ProgressNoteDetail(generics.RetrieveUpdateAPIView):
    queryset = ProgressNote.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProgressNoteSerializer


class AllergyList(generics.ListCreateAPIView):
    queryset = Allergy.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AllergySerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']


class MedicationList(generics.ListCreateAPIView):
    queryset = Medication.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MedicationSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']


class DiagnosisList(generics.ListCreateAPIView):
    queryset = Diagnosis.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DiagnosisSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']
