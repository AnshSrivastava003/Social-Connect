import uuid
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from supabase import create_client, Client

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

class UploadImageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided."}, status=400)
        if file.size > 2 * 1024 * 1024:
            return Response({"detail": "Max file size is 2MB."}, status=400)
        if file.content_type not in ["image/jpeg", "image/png"]:
            return Response({"detail": "Only JPEG/PNG allowed."}, status=400)

        filename = f"{request.user.id}/{uuid.uuid4().hex}-{file.name}"
        supabase = get_supabase()
        bucket = settings.SUPABASE_BUCKET or "images"
        res = supabase.storage.from_(bucket).upload(path=filename, file=file, file_options={"contentType": file.content_type})
        if res.get("error"):
            return Response({"detail": "Upload failed"}, status=500)
        public_url = supabase.storage.from_(bucket).get_public_url(filename)
        return Response({"url": public_url}, status=201)
