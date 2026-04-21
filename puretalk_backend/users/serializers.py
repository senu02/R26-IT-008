from rest_framework import serializers
from django.contrib.auth import get_user_model
from datetime import date
import re

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Email and password are required")
        
        return data


class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'password', 'confirm_password',
            'full_name', 'mobile_number', 'birthday', 'gender',
            'country', 'city', 'profile_picture', 'cover_image'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'confirm_password': {'write_only': True},
            'profile_picture': {'required': False},
            'cover_image': {'required': False},
            'full_name': {'required': False},
            'mobile_number': {'required': False},
            'birthday': {'required': False},
            'gender': {'required': False},
            'country': {'required': False},
            'city': {'required': False},
        }

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        data.pop('confirm_password')
        
        if User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError({"email": "This email is already registered."})
        
        if data.get('birthday'):
            today = date.today()
            age = today.year - data['birthday'].year - (
                (today.month, today.day) < (data['birthday'].month, data['birthday'].day)
            )
            if age < 13:
                raise serializers.ValidationError({"birthday": "You must be at least 13 years old to register."})
            if age > 120:
                raise serializers.ValidationError({"birthday": "Please enter a valid birth date."})
        
        if data.get('mobile_number'):
            if not re.match(r'^\+?[0-9]{10,15}$', data['mobile_number']):
                raise serializers.ValidationError({"mobile_number": "Enter a valid mobile number."})
        
        return data

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField(read_only=True)
    display_name = serializers.SerializerMethodField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    is_moderator = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'mobile_number', 
            'birthday', 'age', 'gender', 'country', 'city',
            'profile_picture', 'cover_image', 'display_name', 
            'date_joined', 'role', 'account_status', 'bio',
            'website', 'work', 'education', 'relationship_status',
            'is_admin', 'is_moderator', 'last_active'
        )
        read_only_fields = ('id', 'date_joined', 'age', 'display_name', 'role', 'account_status', 'last_active')
    
    def get_age(self, obj):
        return obj.get_age()
    
    def get_display_name(self, obj):
        return obj.get_full_name_display()
    
    def validate_email(self, value):
        user = self.instance
        if user and user.email != value:
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("This email is already in use.")
        return value


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin to update other users"""
    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'mobile_number', 'birthday', 'gender',
            'country', 'city', 'role', 'account_status', 'bio', 'website',
            'work', 'education', 'relationship_status', 'is_active'
        )
    
    def validate_role(self, value):
        # Prevent demoting super admin if only one exists
        if self.instance and self.instance.role == 'super_admin':
            if value != 'super_admin' and User.objects.filter(role='super_admin').count() == 1:
                raise serializers.ValidationError("Cannot demote the only super admin")
        return value


class UserSuspendSerializer(serializers.Serializer):
    days = serializers.IntegerField(min_value=1, max_value=365)
    reason = serializers.CharField(max_length=500, required=False)


class UserBanSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, required=True)