# encoding: utf-8

from datetime import datetime

from django import forms
from django.core.validators import MinValueValidator, MaxValueValidator

from app.routes.forms import RouteIdMixin
from .models import Sport, Workout


class WorkoutForm(RouteIdMixin):
    notes = forms.CharField(widget=forms.widgets.Textarea, required=False)
    datetime_start = forms.DateField(label='Date', input_formats=['%d-%m-%Y'])
    time_start = forms.TimeField(label='Start time')
    duration_hours = forms.IntegerField(
        validators=[MinValueValidator(0)], initial=0, required=False)
    duration_mins = forms.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(59)], initial=0,
        required=False)
    duration_secs = forms.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(59)], initial=0,
        required=False)
    sport = forms.ChoiceField(label='Discipline')

    class Meta:
        button_text = 'Save'
        exclude = ('user', 'datetime_stop', 'is_active')
        model = Workout
        name = 'Create Workout'

    def __init__(self, initial=None, *args, **kwargs):
        super(WorkoutForm, self).__init__(*args, **kwargs)

        now_ = datetime.now()
        now_date = now_.strftime('%d-%m-%Y')
        now_time = now_.strftime('%H:%M')

        initial = initial or {}
        initial['datetime_start'] = initial.get('datetime_start', now_date)
        initial['time_start'] = initial.get('time_start', now_time)

        self.initial = initial
        self.fields['sport'].choices = Sport.get_sports_choices()

    def clean_duration_secs(self):
        cd = self.cleaned_data
        hours = cd.get('duration_hours')
        mins = cd.get('duration_mins')
        secs = cd.get('duration_secs')

        if not any([hours, mins, secs]):
            raise forms.ValidationError('Workout duration is required')

        return secs

    def clean_sport(self):
        return Sport.objects.get(pk=self.cleaned_data['sport'])

    def save(self, *args, **kwargs):
        # save as normal model form
        workout = super(WorkoutForm, self).save(*args, **kwargs)

        # get route and assign it to workout
        self.assign_route_to_workout(workout)

        return workout

