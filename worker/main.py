import subprocess
cmd = ["python", "render.py"]
subprocess.run(cmd, check=True)

print("done")