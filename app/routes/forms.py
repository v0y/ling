# encoding: utf-8

from django import forms

from .models import Route


class RouteIdMixin():
    def clear_route_id(self):
        if self.cleaned_data['route_id']:
            id = self.cleaned_data['route_id']
            if Route.objects.filter(id=id).exists():
                return id
            else:
                raise forms.ValidationError("Non-existent route id supplied.")

    def assign_route_to_workout(self, workout):
        # get route
        route_id = self.cleaned_data['route_id']
        if route_id:
            route = Route.objects.get(id=route_id)

        # save
        route.workout = workout
        route.save()
