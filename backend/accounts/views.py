from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .authentication import SupabaseAuthentication
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.http import Http404


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def protected_view(request):
    user = request.user
    return Response({
        "message": f"Hello, {user.username}!",
        "role": user.role
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_role(request):
    role = request.data.get('role')
    if role not in ['user', 'organization']:
        return Response({"error": "Invalid role"}, status=400)
    
    request.user.role = role
    request.user.save()
    return Response({"status": "Role updated"})

@api_view(['POST'])
@permission_classes([AllowAny])
def sync_user(request):
    # Use your existing authentication class to get or create the user
    auth = SupabaseAuthentication()
    try:
        user, _ = auth.authenticate(request)
        if user:
            return Response({'status': 'success'}, status=status.HTTP_200_OK)
        return Response({'error': 'Authentication failed'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



