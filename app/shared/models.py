# encoding: utf-8

from hashlib import sha1
import time

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.urlresolvers import reverse
from django.db import models
from fiut.helpers import slugify

from .helpers import create_url


class SHA1TokenMixin(models.Model):
    token = models.CharField(verbose_name=u'token', max_length=40, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # create hash based on time
        if not self.token:
            self.token = sha1(str(time.time())).hexdigest()

        # run normal save
        return super(SHA1TokenMixin, self).save(*args, **kwargs)

    def get_activation_link(self, url_name, token_param_name='token'):
        """
        Get complete url with token

        :param url_name: url name from urls.py
        :param token_param_name: name of get param for token.
        :returns: complete url with get 'token_param_name=token'
        :rtype: str
        """
        # get site
        site = Site.objects.get(pk=settings.SITE_ID)

        # get activation link
        activation_url = create_url(
            scheme='http', url=site.domain,
            path=reverse(url_name),
            params={token_param_name: self.token})

        return activation_url


class CreatedAtMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class NameMixin(models.Model):
    name = models.CharField(max_length=64)

    class Meta:
        abstract = True

    def __unicode__(self):
        return self.name


class RelatedDateMixin(models.Model):
    related_date = models.DateField()

    class Meta:
        abstract = True


class SlugMixin(models.Model):
    slug = models.SlugField(null=True, blank=True, unique=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # create slug
        if not self.slug:
            self.slug = slugify(self.name)

        # run normal save
        return super(SlugMixin, self).save(*args, **kwargs)
