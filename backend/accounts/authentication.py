import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from accounts.models import User
from organizations.models import OrganizationProfile


SUPABASE_JWT_SECRET = settings.SUPABASE_JWT_SECRET

# authentication.py
class SupabaseAuthentication(authentication.BaseAuthentication):
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
            
            # Debug print
            # print("JWT payload:", payload)
            
            role = None
            
            # 1. Check header first
            header_role = request.headers.get('X-User-Role')
            if header_role:
                role = header_role
                print("Role from header:", role)
            
            # 2. Try to get from user_metadata
            if not role and 'user_metadata' in payload:
                user_metadata = payload.get('user_metadata', {})
                if isinstance(user_metadata, dict) and 'role' in user_metadata:
                    role = user_metadata.get('role')
                    print("Role from user_metadata:", role)
            
            # 3. Try to get from app_metadata
            if not role and 'app_metadata' in payload:
                app_metadata = payload.get('app_metadata', {})
                if isinstance(app_metadata, dict) and 'role' in app_metadata:
                    role = app_metadata.get('role')
                    print("Role from app_metadata:", role)
            
            # 4. Default fallback
            if not role:
                role = "user"
                print("Using default role:", role)

            if not email:
                raise exceptions.AuthenticationFailed("Email not found in token")

            # Ensure role is valid
            valid_roles = dict(User.ROLE_CHOICES).keys()
            if role not in valid_roles:
                print(f"Invalid role '{role}', defaulting to 'user'")
                role = "user"
            else:
                print("Final role being used:", role)

            user, created = User.objects.update_or_create(
                username=email,
                defaults={
                    "email": email,
                    "role": role, 
                }
            )

            # if role == 'organization':
            #     OrganizationProfile.objects.update_or_create(
            #         owner=user,
            #     )

            return (user, None)
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed(f"Invalid Supabase token: {str(e)}")