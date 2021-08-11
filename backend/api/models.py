from django.db import models
from django.utils.translation import gettext_lazy as _

# Create your models here.


class InsuranceProvider(models.Model):
    name = models.CharField(max_length=50, unique=True)


class Patient(models.Model):
    class SexEnum(models.TextChoices):
        MALE = 'M', _('Male')
        FEMALE = 'F', _('Female')

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(
        max_length=254, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=25, unique=True, null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    insurance_provider = models.ForeignKey(
        InsuranceProvider, on_delete=models.SET_NULL, null=True, blank=True)
    insurance_member_id = models.CharField(
        max_length=254, null=True, blank=True)
    is_new = models.BooleanField(default=True)
    sex = models.CharField(max_length=2, null=True, blank=True,
                           choices=SexEnum.choices)


class Appointment(models.Model):
    class StatusEnum(models.TextChoices):
        SCHEDULED = 'SC', _('Scheduled')
        CHECKED_IN = 'CI', _('Checked In')
        DONE = 'DO', _('Done')

    start = models.DateTimeField()
    end = models.DateTimeField()
    status = models.CharField(
        max_length=2, choices=StatusEnum.choices, default=StatusEnum.SCHEDULED)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(null=True, blank=True)


class Allergy(models.Model):
    name = models.CharField(max_length=30, unique=True)


class Medication(models.Model):
    name = models.CharField(max_length=30, unique=True)


class Diagnosis(models.Model):
    name = models.CharField(max_length=30, unique=True)


class ProgressNote(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    weight = models.DecimalField(max_digits=6, decimal_places=2)
    height = models.DecimalField(max_digits=6, decimal_places=2)
    blood_pressure_sys = models.IntegerField()
    blood_pressure_dia = models.IntegerField()
    chief_complaint = models.CharField(max_length=254, null=True, blank=True)
    allergies = models.ManyToManyField(Allergy, blank=True)
    medical_history = models.TextField(null=True, blank=True)
    medication = models.ManyToManyField(Medication, blank=True)
    diagnoses = models.ManyToManyField(Diagnosis, blank=True)
    treatment = models.CharField(max_length=254, null=True, blank=True)
    doctors_orders = models.CharField(max_length=254, null=True, blank=True)
