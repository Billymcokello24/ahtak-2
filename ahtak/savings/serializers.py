from rest_framework import serializers
from .models import SavingsAccountType, SavingsAccount, SavingsTransaction


class SavingsAccountTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavingsAccountType
        fields = '__all__'


class SavingsAccountSerializer(serializers.ModelSerializer):
    account_type_name = serializers.CharField(source='account_type.name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = SavingsAccount
        fields = '__all__'
        read_only_fields = ('account_number', 'balance', 'opened_at')


class SavingsTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavingsTransaction
        fields = '__all__'
        read_only_fields = ('balance_after', 'created_at')
