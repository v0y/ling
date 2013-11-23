# encoding: utf-8

from django import forms

from .models import Route


class RouteIdMixin(forms.Form):
    route_id = forms.IntegerField(required=False, widget=forms.HiddenInput())

    def clear_route_id(self):
        if self.cleaned_data['route_id']:
            id = self.cleaned_data['route_id']
            if Route.objects.filter(id=id).exists():
                return id
            else:
                raise forms.ValidationError("Non-existent route id supplied.")
