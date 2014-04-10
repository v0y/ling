# coding: utf-8

from datetime import datetime, timedelta
from pytz import UTC

from django.contrib.auth.models import User
from django_nose import FastFixtureTestCase

from .models import Distance, Sport, Workout, BestTime


class CreateWorkoutsMixin(object):
    def setUp(self):
        # create request and user
        user = User.objects.create(username='a', email='a@a.aa', password='a')

        # create workout
        sport = Sport.objects.create(name=u'sport', category='cycling')
        defaults = {
            'user': user,
            'sport': sport,
            'datetime_start': datetime(2000, 01, 01, 12, tzinfo=UTC),
            'datetime_stop': datetime(2000, 01, 01, 13, tzinfo=UTC),
        }
        self.workout1 = Workout.objects.create(distance=5, **defaults)
        self.workout2 = Workout.objects.create(distance=10.5, **defaults)
        self.workout3 = Workout.objects.create(distance=11.111, **defaults)


class TestWorkoutTestCase(CreateWorkoutsMixin, FastFixtureTestCase):

    def test_best_time_for_x_km(self):
        test_values = [
            (self.workout1, [
                # (distance, expected_value)
                (1, timedelta(minutes=12)),
                (1.76, timedelta(seconds=1267)),
                (3, timedelta(seconds=2160)),
                (5, timedelta(minutes=60)),
                (8.83, None),
                (10, None),
            ]),
            (self.workout2, [
                (1, timedelta(seconds=342)),
                (1.76, timedelta(seconds=603)),
                (3, timedelta(seconds=1028)),
                (5, timedelta(seconds=1714)),
                (8.83, timedelta(seconds=3027)),
                (10, timedelta(seconds=3428)),
            ]),
            (self.workout3, [
                (1, timedelta(seconds=324)),
                (1.76, timedelta(seconds=570)),
                (3, timedelta(seconds=972)),
                (5, timedelta(seconds=1620)),
                (8.83, timedelta(seconds=2860)),
                (10, timedelta(seconds=3240)),
            ]),
        ]

        for workout, test_cases in test_values:
            for case in test_cases:
                self.assertEqual(workout.best_time_for_x_km(case[0]), case[1])

    def test_best_time_for_x_mi(self):
        time_for_1_mi = self.workout1.best_time_for_x_mi(1)
        time_for_3_mi = self.workout1.best_time_for_x_mi(3)

        expected_for_1_mi = timedelta(seconds=1158)
        expected_for_3_mi = timedelta(seconds=3476)

        self.assertEqual(time_for_1_mi, expected_for_1_mi)
        self.assertEqual(time_for_3_mi, expected_for_3_mi)


class TestDistancesTestCase(FastFixtureTestCase):

    def setUp(self):
        self.distance1 = Distance.objects.get(distance=1, unit='km')
        self.distance2 = Distance.objects.get(distance=10, unit='km')
        self.distance3 = Distance.objects.get(distance=42.195, unit='km')
        self.distance4 = Distance.objects.get(distance=1, unit='mi')
        self.distance5 = Distance.objects.create(distance=15.99, unit='mi')
        self.distance6 = Distance.objects.get(distance=100, unit='mi')

    def test_distance_km(self):
        self.assertEqual(self.distance1.distance_km, 1)
        self.assertEqual(self.distance2.distance_km, 10)
        self.assertEqual(self.distance3.distance_km, 42.195)
        self.assertEqual(self.distance4.distance_km, 1.60934)
        self.assertEqual(self.distance5.distance_km, 25.7333466)
        self.assertEqual(self.distance6.distance_km, 160.934)
