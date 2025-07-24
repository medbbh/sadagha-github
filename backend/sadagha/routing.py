from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import volunteers.routing

application = ProtocolTypeRouter({
    # Django's ASGI application to handle traditional HTTP requests
    "http": get_asgi_application(),
    
    # WebSocket chat handler
    "websocket": AuthMiddlewareStack(
        URLRouter([
            # Include volunteer WebSocket URLs
            *volunteers.routing.websocket_urlpatterns,
            
            # You can add more app WebSocket URLs here later:
            # *other_app.routing.websocket_urlpatterns,
        ])
    ),
})