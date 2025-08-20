import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from accounts.models import User
from django.contrib.auth.models import AnonymousUser

SUPABASE_JWT_SECRET = settings.SUPABASE_JWT_SECRET
    

class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Standard authentication for regular endpoints.
    Requires user to exist in Django database.
    """
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            email = payload.get("email")
            
            if not email:
                raise exceptions.AuthenticationFailed("Email not found in token")

            # ONLY authenticate existing users - don't create new ones
            try:
                user = User.objects.get(username=email)
                return (user, None)
            except User.DoesNotExist:
                # User exists in Supabase but not in Django - they need to complete registration
                raise exceptions.AuthenticationFailed("User not registered. Please complete registration first.")
                
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token expired")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Invalid token")
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed(f"Authentication failed: {str(e)}")

class SupabaseRegistrationAuthentication(authentication.BaseAuthentication):
    """
    Authentication class specifically for registration endpoints.
    Only validates JWT without checking Django user existence.
    """
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            email = payload.get("email")
            
            if not email:
                return None  # Invalid token but don't raise exception
                
            # Create a temporary user object for the request
            # This won't be saved to the database
            temp_user = AnonymousUser()
            temp_user.email = email
            temp_user.supabase_payload = payload
            temp_user.is_authenticated = True  # Make it appear authenticated for permission checks
            
            return (temp_user, payload)
            
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
            print(f"Registration auth - Invalid token: {e}")
            return None  # Invalid token but don't raise exception
        except Exception as e:
            # print(f"Registration authentication error: {str(e)}")
            return None


class SupabaseAdminAuthentication(SupabaseAuthentication):
    """Admin-specific authentication"""
    def authenticate(self, request):
        user, auth = super().authenticate(request)
        if user and (user.role == 'admin' or user.is_platform_admin):
            return (user, auth)
        return None