from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .authentication import SupabaseAuthentication, SupabaseRegistrationAuthentication
import jwt
from django.conf import settings
from accounts.models import User

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
    print("=== REGISTER USER DEBUG ===")
    print(f"Request user: {request.user}")
    print(f"Has supabase_payload: {hasattr(request.user, 'supabase_payload')}")
    
    # Extract email from the authenticated payload
    if hasattr(request.user, 'supabase_payload'):
        payload = request.user.supabase_payload
        email = payload.get("email")
        print(f"Email from payload: {email}")
    else:
        # Fallback to manual JWT decoding
        print("Fallback to manual JWT decoding")
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
            print(f"Email from manual decode: {email}")
        except Exception as e:
            print(f"Manual decode error: {e}")
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not email:
        return Response({"error": "Email not found in token"}, status=status.HTTP_400_BAD_REQUEST)
    
    role = request.data.get('role', 'user')
    print(f"Role: {role}")
    
    # Validate role
    if role not in ['user', 'organization']:
        return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user already exists
    if User.objects.filter(username=email).exists():
        print("User already exists")
        return Response({"error": "User already registered"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create the user
    try:
        full_name = payload.get("user_metadata", {}).get("full_name", "")
        user = User.objects.create(
            username=email,
            email=email,
            role=role,
            first_name=full_name.split()[0] if full_name else "",
            last_name=" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else ""
        )
        
        print(f"User created successfully: {user.email} with role {user.role}")
        
        return Response({
            "status": "User registered successfully",
            "user": {
                "email": user.email,
                "role": user.role,
                "id": user.id
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"User creation error: {e}")
        return Response({"error": f"Failed to create user: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([SupabaseRegistrationAuthentication])
@permission_classes([AllowAny])
def check_user_exists(request):
    """
    Check if user exists in Django database
    """
    print("=== CHECK USER EXISTS DEBUG ===")
    print(f"Request user: {request.user}")
    print(f"Has supabase_payload: {hasattr(request.user, 'supabase_payload')}")
    
    # Extract email from the authenticated payload
    if hasattr(request.user, 'supabase_payload'):
        payload = request.user.supabase_payload
        email = payload.get("email")
        print(f"Email from payload: {email}")
    else:
        # Fallback to manual JWT decoding
        print("Fallback to manual JWT decoding")
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
            print(f"Email from manual decode: {email}")
        except Exception as e:
            print(f"Manual decode error: {e}")
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if not email:
        return Response({"error": "Email not found in token"}, status=status.HTTP_400_BAD_REQUEST)
    
    user_exists = User.objects.filter(username=email).exists()
    print(f"User exists in Django: {user_exists}")
    
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
        print(f"User data: {user_data}")
    
    return Response({
        "exists": user_exists,
        "email": email,
        "user": user_data
    })