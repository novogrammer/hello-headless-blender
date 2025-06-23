import os
import subprocess
import tempfile
from minio import Minio


bucket_name="blender"

client = Minio(
  endpoint="minio:9000",
  secure=False,
  access_key=os.getenv('MINIO_ROOT_USER'),
  secret_key=os.getenv('MINIO_ROOT_PASSWORD')
)

# Make the bucket if it doesn't exist.
found = client.bucket_exists(bucket_name)
if not found:
    client.make_bucket(bucket_name)
    print("Created bucket", bucket_name)
else:
    print("Bucket", bucket_name, "already exists")


with tempfile.TemporaryDirectory() as temp_dir:
  cmd = ["python", "render_worker.py" ,temp_dir]
  subprocess.run(cmd, check=True)
  filepath=os.path.join(temp_dir, "test.png")
  if os.path.exists(filepath):
    print("file exists")
    client.fput_object(
      bucket_name, "foo/test.png", filepath,
    )
  else:
    print("file not exists")



print("done")