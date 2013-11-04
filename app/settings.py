# coding: utf-8

from os.path import dirname, join, realpath
import sys

_current_dir = dirname(realpath(__file__))

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'stwa',
        'USER': 'stwa',
        'PASSWORD': 'stwa',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

# switch to sqlite for tests
if 'test' in sys.argv:
    DATABASES['default'] = {'ENGINE': 'django.db.backends.sqlite3'}

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = []

TIME_ZONE = 'Europe/Warsaw'
LANGUAGE_CODE = 'pl'

SITE_ID = 1

USE_I18N = True
USE_L10N = True
USE_TZ = True

MEDIA_ROOT = join(_current_dir, 'media')
MEDIA_URL = '/media/'

STATIC_ROOT = join(_current_dir, 'public_html')
STATIC_URL = '/static/'


# Additional locations of static files
STATICFILES_DIRS = (
    join(_current_dir, 'submodules'),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'u=c2brcszbq7r45^94)xdi(lz=d^%-yoi(38xwq5k0u*8wmb3v'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    # core
    "django.core.context_processors.request",
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages",

    #internal
    "app.shared.context_processors.settings_values",
)

ROOT_URLCONF = 'app.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'app.wsgi.application'

TEMPLATE_DIRS = (
)

INSTALLED_APPS = filter(None, [
    # core
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'django.contrib.admindocs',

    # third-party
    'debug_toolbar' if DEBUG else None,
    'django_nvd3',
    'gravatar',
    'south',
    'django_nose',  # https://github.com/jbalogh/django-nose#using-with-south
    'widget_tweaks',

    # internal
    'app.accounts',
    'app.home',
    'app.shared',
    'app.health',
])

TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

# gravatar
# https://github.com/nvie/django-gravatar
GRAVATAR_CHANGE_URL = 'http://gravatar.com/emails/'
GRAVATAR_DEFAULT_IMAGE = 'monsterid'
GRAVATAR_DEFAULT_SIZE = 210

# setup debug_toolbar
if DEBUG:
    INTERNAL_IPS = ['127.0.0.1', ]

    DEBUG_TOOLBAR_PANELS = filter(None, [
        'debug_toolbar.panels.timer.TimerDebugPanel',
        'debug_toolbar.panels.sql.SQLDebugPanel',
        'debug_toolbar.panels.version.VersionDebugPanel',
        'debug_toolbar.panels.settings_vars.SettingsVarsDebugPanel',
        'debug_toolbar.panels.headers.HeaderDebugPanel',
        'debug_toolbar.panels.request_vars.RequestVarsDebugPanel',
        'debug_toolbar.panels.template.TemplateDebugPanel',
        'debug_toolbar.panels.signals.SignalDebugPanel',
        'debug_toolbar.panels.logger.LoggingPanel',
    ])

    DEBUG_TOOLBAR_CONFIG = {
        'INTERCEPT_REDIRECTS': False
    }

# accounts
REDIRECT_AFTER_LOGIN = '/'
REDIRECT_AFTER_LOGOUT = '/'
ACCOUNT_ACTIVATION_DAYS = 7
PASSWORD_RESET_TIMEOUT_DAYS = 3
EMAIL_CHANGE_TIMEOUT_DAYS = 3
LOGIN_URL = '/accounts/login'

# email configuration
DEFAULT_FROM_EMAIL = 'no-reply@example.com'

if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    # TODO: konfiguracja SMTP
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = ''
    EMAIL_PORT = 25
    EMAIL_HOST_USER = ''
    EMAIL_HOST_PASSWORD = ''
    EMAIL_USE_TLS = False

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}

# switch to sqlite for tests
import sys
if 'test' in sys.argv:
    DATABASES['default'] = {'ENGINE': 'django.db.backends.sqlite3'}
