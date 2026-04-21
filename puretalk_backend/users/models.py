from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import date
import re


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required.')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        return self.create_user(email, password, **extra_fields)


class UserRole(models.TextChoices):
    USER = 'user', 'User'
    MODERATOR = 'moderator', 'Moderator'
    ADMIN = 'admin', 'Admin'
    SUPER_ADMIN = 'super_admin', 'Super Admin'


class AccountStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    SUSPENDED = 'suspended', 'Suspended'
    BANNED = 'banned', 'Banned'
    DEACTIVATED = 'deactivated', 'Deactivated'


class CustomUser(AbstractUser):
    # Remove username field completely
    username = models.CharField(max_length=150, unique=False, blank=True, null=True)
    email = models.EmailField(max_length=200, unique=True)
    birthday = models.DateField(null=True, blank=True)
    
    # Profile Fields
    full_name = models.CharField(max_length=300, blank=True, null=True)
    mobile_number = models.CharField(max_length=20, blank=True, null=True)
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('custom', 'Custom'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='cover_images/', blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    
    # Role and Status Fields
    role = models.CharField(
        max_length=20, 
        choices=UserRole.choices, 
        default=UserRole.USER
    )
    account_status = models.CharField(
        max_length=20, 
        choices=AccountStatus.choices, 
        default=AccountStatus.ACTIVE
    )
    
    # Facebook-like fields
    bio = models.TextField(max_length=500, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    work = models.CharField(max_length=200, blank=True, null=True)
    education = models.CharField(max_length=200, blank=True, null=True)
    relationship_status = models.CharField(
        max_length=20,
        choices=[
            ('single', 'Single'),
            ('in_relationship', 'In a Relationship'),
            ('engaged', 'Engaged'),
            ('married', 'Married'),
            ('divorced', 'Divorced'),
            ('widowed', 'Widowed'),
        ],
        blank=True,
        null=True
    )
    
    # Moderation fields
    suspended_until = models.DateTimeField(blank=True, null=True)
    suspension_reason = models.TextField(blank=True, null=True)
    banned_at = models.DateTimeField(blank=True, null=True)
    banned_reason = models.TextField(blank=True, null=True)
    
    # Tracking
    last_active = models.DateTimeField(auto_now=True)
    account_verified = models.BooleanField(default=False)
    
    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
    
    def save(self, *args, **kwargs):
        # If full_name is provided but no first_name/last_name, set them
        if self.full_name and not self.first_name:
            name_parts = self.full_name.split(' ', 1)
            self.first_name = name_parts[0]
            if len(name_parts) > 1:
                self.last_name = name_parts[1]
        super().save(*args, **kwargs)
    
    def get_full_name_display(self):
        """Return full name or email if not set"""
        return self.full_name if self.full_name else self.email
    
    def get_age(self):
        """Calculate age from birthday"""
        if self.birthday:
            today = date.today()
            return today.year - self.birthday.year - (
                (today.month, today.day) < (self.birthday.month, self.birthday.day)
            )
        return None
    
    # Role check methods
    @property
    def is_admin(self):
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @property
    def is_super_admin(self):
        return self.role == UserRole.SUPER_ADMIN
    
    @property
    def is_moderator(self):
        return self.role in [UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @property
    def is_suspended(self):
        return self.account_status == AccountStatus.SUSPENDED
    
    @property
    def is_banned(self):
        return self.account_status == AccountStatus.BANNED
    
    def can_moderate(self):
        """Check if user can moderate content"""
        return self.is_moderator and self.account_status == AccountStatus.ACTIVE
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and self.account_status == AccountStatus.ACTIVE