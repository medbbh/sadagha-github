# organizations/serializers.py - Simple Payment System

from rest_framework import serializers
from .models import OrganizationProfile, WalletProvider, ManualPayment, NextPayPayment
from django.core.exceptions import ValidationError as DjangoValidationError
from campaign.models import Campaign

class WalletProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletProvider
        fields = ['id', 'name']

class ManualPaymentSerializer(serializers.ModelSerializer):
    wallet_provider = WalletProviderSerializer(read_only=True)
    wallet_provider_id = serializers.IntegerField(write_only=True)
    wallet_provider_name = serializers.CharField(source='wallet_provider.name', read_only=True)
    organization_name = serializers.CharField(source='organization.org_name', read_only=True)

    class Meta:
        model = ManualPayment
        fields = [
            'id', 'wallet_provider', 'wallet_provider_id', 'wallet_provider_name',
            'phone_number', 'account_name', 'is_active', 'organization_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_wallet_provider_id(self, value):
        """Validate wallet provider exists and is active"""
        try:
            wallet = WalletProvider.objects.get(id=value, is_active=True)
        except WalletProvider.DoesNotExist:
            raise serializers.ValidationError("Wallet provider not found or inactive")
        return value

    def validate_phone_number(self, value):
        """Basic phone number validation"""
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits")
        
        if len(value) < 8 or len(value) > 12:
            raise serializers.ValidationError("Phone number must be between 8-12 digits")
        
        return value

    def create(self, validated_data):
        wallet_provider_id = validated_data.pop('wallet_provider_id')
        wallet_provider = WalletProvider.objects.get(id=wallet_provider_id)
        
        try:
            manual_payment = ManualPayment.objects.create(
                wallet_provider=wallet_provider,
                **validated_data
            )
            return manual_payment
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))

class NextPayPaymentSerializer(serializers.ModelSerializer):
    wallet_provider = WalletProviderSerializer(read_only=True)
    wallet_provider_id = serializers.IntegerField(write_only=True)
    wallet_provider_name = serializers.CharField(source='wallet_provider.name', read_only=True)
    organization_name = serializers.CharField(source='organization.org_name', read_only=True)

    class Meta:
        model = NextPayPayment
        fields = [
            'id', 'wallet_provider', 'wallet_provider_id', 'wallet_provider_name',
            'commercial_number', 'account_name', 'is_active', 'verified_at',
            'organization_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'verified_at', 'created_at', 'updated_at']

    def validate_wallet_provider_id(self, value):
        """Validate wallet provider exists and is active"""
        try:
            wallet = WalletProvider.objects.get(id=value, is_active=True)
        except WalletProvider.DoesNotExist:
            raise serializers.ValidationError("Wallet provider not found or inactive")
        return value

    def validate_commercial_number(self, value):
        """Basic commercial number validation"""
        if not value.isdigit():
            raise serializers.ValidationError("Commercial number must contain only digits")
        
        if len(value) < 6 or len(value) > 20:
            raise serializers.ValidationError("Commercial number must be between 6-20 digits")
        
        return value

    def create(self, validated_data):
        wallet_provider_id = validated_data.pop('wallet_provider_id')
        wallet_provider = WalletProvider.objects.get(id=wallet_provider_id)
        
        try:
            nextpay_payment = NextPayPayment.objects.create(
                wallet_provider=wallet_provider,
                **validated_data
            )
            return nextpay_payment
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))

class OrganizationProfileSerializer(serializers.ModelSerializer):
    manual_payments = ManualPaymentSerializer(many=True, read_only=True)
    nextpay_payments = NextPayPaymentSerializer(many=True, read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    
    # Payment summary fields
    total_payment_methods = serializers.SerializerMethodField()
    has_manual_payments = serializers.SerializerMethodField()
    has_nextpay_payments = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizationProfile
        fields = [
            'id', 'org_name', 'description', 'owner', 'owner_email', 'owner_id',
            'address', 'phone_number', 'website', 'document_url', 'document_path',
            'profile_image_url', 'profile_image_path', 'cover_image_url', 'cover_image_path',
            'is_verified', 'manual_payments', 'nextpay_payments',
            'total_payment_methods', 'has_manual_payments', 'has_nextpay_payments',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'owner', 'owner_email', 'owner_id', 'document_url', 'document_path',
            'profile_image_url', 'profile_image_path', 'cover_image_url', 'cover_image_path',
            'created_at', 'updated_at'
        ]

    def get_total_payment_methods(self, obj):
        """Get total number of payment methods"""
        try:
            manual_count = obj.manual_payments.filter(is_active=True).count()
            nextpay_count = obj.nextpay_payments.filter(is_active=True).count()
            return manual_count + nextpay_count
        except AttributeError:
            return 0

    def get_has_manual_payments(self, obj):
        """Check if organization has active manual payments"""
        try:
            return obj.manual_payments.filter(is_active=True).exists()
        except AttributeError:
            return False

    def get_has_nextpay_payments(self, obj):
        """Check if organization has active NextPay payments"""
        try:
            return obj.nextpay_payments.filter(is_active=True).exists()
        except AttributeError:
            return False

# Simple summary serializer for quick API responses
class PaymentMethodsSummarySerializer(serializers.Serializer):
    """Summary of all payment methods for an organization"""
    manual_payments_count = serializers.IntegerField()
    nextpay_payments_count = serializers.IntegerField()
    total_payment_methods = serializers.IntegerField()
    has_manual_payments = serializers.BooleanField()
    has_nextpay_payments = serializers.BooleanField()
    payment_ready = serializers.BooleanField()
    
    manual_payments = ManualPaymentSerializer(many=True)
    nextpay_payments = NextPayPaymentSerializer(many=True)


# This for the user

class PublicOrganizationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProfile
        fields = [
            'id', 'org_name', 'description', 'address', 'phone_number', 'website',
            'profile_image_url', 'cover_image_url', 'is_verified', 'created_at'
        ]