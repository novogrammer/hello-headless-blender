import bpy
import os

# 出力先ディレクトリ
output_dir = os.path.abspath("./renders")
os.makedirs(output_dir, exist_ok=True)

# 出力ファイルパス
bpy.context.scene.render.filepath = os.path.join(output_dir, "test.png")

# 解像度設定（任意）
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080

# レンダーエンジン設定（'CYCLES' or 'BLENDER_EEVEE'）
bpy.context.scene.render.engine = 'CYCLES'

# 実際のレンダリング実行
bpy.ops.render.render(write_still=True)

print("Rendered to:", bpy.context.scene.render.filepath)

