from rest_framework import serializers
from .models import Appointment, Patient, InsuranceProvider, ProgressNote, Allergy, Medication, Diagnosis
from django.db import models
from rest_framework.validators import UniqueValidator


class InsuranceProviderSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=50,
        validators=[
            # apply case-insensitive uniqueness, "Name" cannot be added if "name" exists
            UniqueValidator(
                queryset=InsuranceProvider.objects.all(), lookup='iexact')
        ]
    )

    class Meta:
        model = InsuranceProvider
        fields = ('__all__')


class PatientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Patient
        fields = ('__all__')

    def to_representation(self, instance):
        self.fields['insurance_provider'] = InsuranceProviderSerializer(
            read_only=True)
        return super(PatientSerializer, self).to_representation(instance)

    def validate_phone(self, value):
        # For unique fields (where empty strings are also checked), set blanks to null
        return value if value != '' else None

    def validate_email(self, value):
        return value if value != '' else None


class AppointmentSerializer(serializers.ModelSerializer):
    status_text = serializers.CharField(
        source='get_status_display', read_only=True)

    class Meta:
        model = Appointment
        fields = ('__all__')

    # Show full patient details on GET
    def to_representation(self, instance):
        self.fields['patient'] = PatientSerializer(read_only=True)
        return super(AppointmentSerializer, self).to_representation(instance)


class ProgressNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressNote
        fields = ('__all__')

    # Show full patient details on GET
    def to_representation(self, instance):
        self.fields['allergies'] = AllergySerializer(read_only=True, many=True)
        self.fields['medication'] = MedicationSerializer(
            read_only=True, many=True)
        self.fields['diagnoses'] = DiagnosisSerializer(
            read_only=True, many=True)
        return super(ProgressNoteSerializer, self).to_representation(instance)


class AllergySerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=30,
        validators=[
            UniqueValidator(queryset=Allergy.objects.all(), lookup='iexact')
        ]
    )

    class Meta:
        model = Allergy
        fields = ('__all__')


class MedicationSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=30,
        validators=[
            UniqueValidator(queryset=Medication.objects.all(), lookup='iexact')
        ]
    )

    class Meta:
        model = Medication
        fields = ('__all__')


class DiagnosisSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=30,
        validators=[
            UniqueValidator(queryset=Diagnosis.objects.all(), lookup='iexact')
        ]
    )

    class Meta:
        model = Diagnosis
        fields = ('__all__')
