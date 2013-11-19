# encoding: utf-8

from django.db import models
from jsonfield.fields import JSONField

from app.shared.models import CreatedAtMixin

class Route(CreatedAtMixin):
    tracks_json = JSONField(default='[]')

    start_time = models.DateTimeField(auto_now=False, null=True, verbose_name=u'Czas rozpoczęcia trasy')
    finish_time = models.DateTimeField(auto_now=False, null=True, verbose_name=u'Czas zakończenia trasy')
    length = models.IntegerField(default=0, verbose_name=u'Długość trasy')

