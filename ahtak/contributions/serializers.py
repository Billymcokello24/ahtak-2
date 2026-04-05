from rest_framework import serializers
from .models import ContributionType, MonthlyContribution, ContributionPayment


class ContributionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContributionType
        fields = '__all__'


class MonthlyContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyContribution
        fields = '__all__'


class ContributionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContributionPayment
        fields = '__all__'
