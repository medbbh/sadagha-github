from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .authentication import SupabaseAuthentication, SupabaseRegistrationAuthentication
import jwt
from django.conf import settings
from accounts.models import User
from rest_framework.decorators import action
from .serializers import UserProfileSerializer, ContactSerializer  # Add this import
from django.db.models import Prefetch
from campaign.models import Donation
from .serializers import UserUpdateSerializer
from django.core.mail import send_mail
from django.template.loader import render_to_string

@api_view(["GET"])
@authentication_classes([SupabaseAuthentication])
@permission_classes([IsAuthenticated])
def protected_view(request):
    user = request.user
    return Response({
        "message": f"Hello, {user.username}!",
        "role": user.role
    })

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([IsAuthenticated])
def update_role(request):
    role = request.data.get('role')
    if role not in ['user', 'organization']:
        return Response({"error": "Invalid role"}, status=400)
        
    request.user.role = role
    request.user.save()
    return Response({"status": "Role updated"})

@api_view(['POST'])
@authentication_classes([SupabaseRegistrationAuthentication])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user after Supabase OAuth
    """
    # print("=== REGISTER USER DEBUG ===")
    # print(f"Request user: {request.user}")
    # print(f"Has supabase_payload: {hasattr(request.user, 'supabase_payload')}")
    
    # Extract email and id from the authenticated payload
    if hasattr(request.user, 'supabase_payload'):
        payload = request.user.supabase_payload
        email = payload.get("email")
        supabase_id = payload.get("sub")
        # print(f"Email from payload: {email}")
    else:
        # Fallback to manual JWT decoding
        # print("Fallback to manual JWT decoding")
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"error": "Authorization token required"}, status=status.HTTP_401_UNAUTHORIZED)

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            email = payload.get("email")
            supabase_id = payload.get("sub")
            # print(f"Email from manual decode: {email}")
            # print(f"Supabase ID from manual decode: {supabase_id}")
        except Exception as e:
            print(f"Manual decode error: {e}")
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not email:
        return Response({"error": "Email not found in token"}, status=status.HTTP_400_BAD_REQUEST)
    
    role = request.data.get('role', 'user')
    # print(f"Role: {role}")
    
    # Validate role
    if role not in ['user', 'organization']:
        return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user already exists
    if User.objects.filter(username=email).exists():
        # print("User already exists")
        return Response({"error": "User already registered"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create the user
    try:
        full_name = payload.get("user_metadata", {}).get("full_name", "")
        user = User.objects.create(
            username=email,
            email=email,
            role=role,
            first_name=full_name.split()[0] if full_name else "",
            last_name=" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else "",
            # store the id from Supabase
            supabase_id=supabase_id
        )
        
        # print(f"User created successfully: {user.email} with role {user.role}")
        
        return Response({
            "status": "User registered successfully",
            "user": {
                "email": user.email,
                "role": user.role,
                "id": user.id
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # print(f"User creation error: {e}")
        return Response({"error": f"Failed to create user: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([SupabaseRegistrationAuthentication])
@permission_classes([AllowAny])
def check_user_exists(request):
    """
    Check if user exists in Django database
    # """
    # print("=== CHECK USER EXISTS DEBUG ===")
    # print(f"Request user: {request.user}")
    # print(f"Has supabase_payload: {hasattr(request.user, 'supabase_payload')}")
    
    # Extract email from the authenticated payload
    if hasattr(request.user, 'supabase_payload'):
        payload = request.user.supabase_payload
        email = payload.get("email")
        # print(f"Email from payload: {email}")
        # print(f"Supabase ID from payload: {payload.get('id')}")
    else:
        # Fallback to manual JWT decoding
        # print("Fallback to manual JWT decoding")
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"error": "Authorization token required"}, status=status.HTTP_401_UNAUTHORIZED)

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            email = payload.get("email")
            # print(f"Email from manual decode: {email}")
            # print(f"Supabase ID from manual decode: {payload.get('id')}")
        except Exception as e:
            # print(f"Manual decode error: {e}")
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not email:
        return Response({"error": "Email not found in token"}, status=status.HTTP_400_BAD_REQUEST)
    
    user_exists = User.objects.filter(username=email).exists()
    # print(f"User exists in Django: {user_exists}")
    
    # If user exists, also return their info
    user_data = None
    if user_exists:
        user = User.objects.get(username=email)
        user_data = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "username": user.username
        }
        # print(f"User data: {user_data}")
    
    return Response({
        "exists": user_exists,
        "email": email,
        "user": user_data
    })


# User Profile View
@api_view(['GET', 'PUT']) 
@authentication_classes([SupabaseAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get or update comprehensive user profile
    GET /api/auth/profile/ - Get profile
    PUT /api/auth/profile/ - Update profile
    """
    user = request.user
    
    # Exclude organizations
    if user.role == 'organization':
        return Response(
            {'error': 'Organizations cannot access user profiles'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        try:
            # Your existing GET logic
            user_with_data = User.objects.select_related('volunteer_profile').prefetch_related(
                Prefetch(
                    'donations',
                    queryset=Donation.objects.select_related('campaign').order_by('-created_at')
                )
            ).get(id=user.id)
            
            serializer = UserProfileSerializer(user_with_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    elif request.method == 'PUT':
        try:
            # Update user profile
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Return updated profile data
                user_with_data = User.objects.select_related('volunteer_profile').prefetch_related(
                    Prefetch(
                        'donations',
                        queryset=Donation.objects.select_related('campaign').order_by('-created_at')
                    )
                ).get(id=user.id)
                
                response_serializer = UserProfileSerializer(user_with_data)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Error in PUT: {str(e)}")  # Debug line
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([AllowAny])
def contact_us(request):
    """
    Handle contact form submissions
    """
    serializer = ContactSerializer(data=request.data)
    
    if serializer.is_valid():
        name = serializer.validated_data['name']
        email = serializer.validated_data['email']
        subject = serializer.validated_data['subject']
        message = serializer.validated_data['message']
        
        try:
            # Email content
            email_subject = f"Contact Form: {subject}"
            email_message = f"""
New contact form submission from Sadagha App:

Name: {name}
Email: {email}
Subject: {subject}

Message:
{message}

---
This message was sent from the Sadagha contact form.
            """
            
            # Send email
            send_mail(
                email_subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [settings.EMAIL_HOST_USER],  # Send to your email
                fail_silently=False,
            )
            
            return Response({
                'success': True,
                'message': 'Your message has been sent successfully. We will get back to you soon!'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to send message. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)