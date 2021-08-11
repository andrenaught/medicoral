from django.contrib import admin
from .models import Appointment, Patient, InsuranceProvider


class PatientAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone')

    @admin.display(description='Name')
    def name(self, obj):
        return ("%s %s" % (obj.first_name, obj.last_name))


class InsuranceProviderAdmin(admin.ModelAdmin):
    list_display = ('name',)


# Register your models here.
admin.site.register(Appointment)
admin.site.register(Patient, PatientAdmin)
admin.site.register(InsuranceProvider, InsuranceProviderAdmin)
