from rest_framework import serializers

from .models import Story


class StorySerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            'id',
            'user_id',
            'author_name',
            'author_avatar',
            'image',
            'image_url',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'user_id',
            'author_name',
            'author_avatar',
            'image_url',
            'created_at',
        ]
        extra_kwargs = {'image': {'write_only': True, 'required': True}}

    def get_author_name(self, obj):
        u = obj.user
        if getattr(u, 'full_name', None):
            return u.full_name.strip() or u.email.split('@')[0]
        return u.email.split('@')[0]

    def get_author_avatar(self, obj):
        request = self.context.get('request')
        pic = getattr(obj.user, 'profile_picture', None)
        if not pic:
            return None
        url = pic.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
