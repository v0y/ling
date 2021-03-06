# encoding: utf-8

from datetime import timedelta
from itertools import chain
import json

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.db.models.signals import post_save
from django.dispatch import receiver
from timedelta.fields import TimedeltaField

from app.shared.helpers import is_whole
from app.shared.models import CreatedAtMixin, NameMixin, SlugMixin
from .enums import SPORT_CATEGORIES


class BestTime(models.Model):
    distance = models.ForeignKey('Distance')
    workout = models.ForeignKey('Workout')
    user = models.ForeignKey(User, null=True, blank=True)
    duration = TimedeltaField()

    @classmethod
    def get_records(cls, sport, user):
        distances = sport.get_distances()
        distance_ids = [d.id for d in distances]

        # get from cache
        results = cache.get(cls.records_cache_key(user, sport))
        if results:
            return results

        results = []
        for distance_id in distance_ids:
            best_time = BestTime.objects \
                .filter(
                    distance_id=distance_id,
                    user=user,
                    workout__sport_id=sport.id) \
                .order_by('duration') \
                .select_related('distance') \
                .first()
            if best_time:
                results.append(best_time)

        # set cache
        cache.set(cls.records_cache_key(user, sport), results, 24*60*60)

        return results

    @property
    def duration_visible(self):
        splitted = str(self.duration).split(':')
        result = "%sg:" % splitted[0] if splitted[0] != '0' else ""
        result += "%sm:%ss" % (splitted[1], splitted[2])
        return result

    @staticmethod
    def records_cache_key(user, sport):
        return 'get_records_%s_%s' % (user.id, sport.id)


class Distance(models.Model):
    distance = models.FloatField(unique=True)
    only_for = models.ManyToManyField('Sport', null=True, blank=True)
    name = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ['distance']

    def __unicode__(self):
        distance_repr = int(self.distance) if is_whole else self.distance
        return self.name or "%s km" % distance_repr


class Sport(NameMixin, SlugMixin):
    category = models.CharField(choices=SPORT_CATEGORIES, max_length=16)
    show_distances = models.BooleanField(default=True)
    show_map = models.BooleanField(default=True)

    @classmethod
    def get_sports_choices(cls):
        choices = [('', '---------')]
        choices += [(s.pk, s.name) for s in cls.objects.all().order_by('name')]
        return choices

    def get_distances(self):
        """
        Get distanced for sport.

        :return: distances for sport
        :rtype: list
        """
        if not self.show_distances:
            return

        distances_without_only = \
            Distance.objects.filter(only_for__isnull=True)
        distances_from_only = self.distance_set.filter()
        distances = list(chain(distances_without_only, distances_from_only))

        return sorted(distances, key=lambda d: d.distance)


class Workout(CreatedAtMixin):
    name = models.CharField(max_length=64, null=True, blank=True)
    user = models.ForeignKey(User, related_name='workouts')
    sport = models.ForeignKey('Sport')
    notes = models.CharField(max_length=512, null=True, blank=True)
    distance = models.FloatField(validators=[MinValueValidator(0)], null=True,
        blank=True)
    datetime_start = models.DateTimeField()
    datetime_stop = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __unicode__(self):
        visible_name = self.sport.name
        if self.distance:
            visible_name += ", %s km" % str(self.distance)

        return visible_name

    def get_absolute_url(self):
        return reverse('workouts:show', args=[self.pk])

    @property
    def duration(self):
        return self.datetime_stop - self.datetime_start

    @property
    def duration_visible(self):
        visible = str(self.datetime_stop - self.datetime_start)
        splitted = visible.split(':')
        return '%sh %smin %ss' % (splitted[0], splitted[1], splitted[2])

    @property
    def track(self):
        route = self.routes.first()
        if not route:
            return None

        try:
            track_json = json.loads(route.tracks_json)[0]
        except IndexError:
            return None
        else:
            return track_json

    @property
    def show_chart(self):
        track = self.track
        if not track:
            return False

        point = track['segments'][0][0]
        if not point.get('time'):
            return False
        else:
            return True

    def best_time_for_x_km(self, distance):
        """
        Get best time on x km

        :param distance: get time for this distance
        :return: fastest time for given distance
        :rtype: timedelta
        """

        if self.distance < distance:
            return

        # if there is no track
        try:
            return self.routes.get().best_time_for_x_km(distance)
        except ObjectDoesNotExist:
            proportions = distance / float(self.distance)
            return timedelta(seconds=int(proportions * self.duration.seconds))

    def update_best_time(self, distance):
        """
        Update or create best time object for given distance

        :param distance: distance object
        :return: None
        """
        best_times = BestTime.objects.filter(distance=distance, workout=self)

        duration = self.best_time_for_x_km(distance.distance)

        if best_times.exists():
            best_times.update(duration=duration)
        else:
            BestTime.objects.create(
                distance=distance, workout=self,
                duration=duration, user=self.user)


@receiver(post_save, sender=Workout)
def update_best_times(sender, instance, **kwargs):
    if instance.distance:
        distances = Distance.objects.filter(distance__lte=instance.distance)

        for distance in distances:
            instance.update_best_time(distance)


@receiver(post_save, sender=BestTime)
def clear_best_time_cache(sender, instance, **kwargs):
    cache_name = \
        BestTime.records_cache_key(instance.user, instance.workout.sport)
    cache.delete(cache_name)
