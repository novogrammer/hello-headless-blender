import os
import subprocess
import tempfile


with tempfile.TemporaryDirectory() as temp_dir:
  cmd = ["python", "render_worker.py" ,temp_dir]
  subprocess.run(cmd, check=True)
  if os.path.exists(os.path.join(temp_dir, "test.png")):
    print("file exists")
  else:
    print("file not exists")



print("done")