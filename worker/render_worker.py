import sys
import tempfile
import bpy
import os



def main(output_dir):

    # blender_filepath=os.path.abspath("./scenes/simple.blend")
    blender_filepath=os.path.abspath("./scenes/suzanne.blend")

    bpy.ops.wm.open_mainfile(filepath=blender_filepath)



    output_filepath = os.path.join(output_dir, "test.png")
    bpy.context.scene.render.filepath = output_filepath

    bpy.context.scene.render.resolution_x = 1920
    bpy.context.scene.render.resolution_y = 1080

    # レンダーエンジン設定（'CYCLES' or 'BLENDER_EEVEE'）
    bpy.context.scene.render.engine = 'CYCLES'

    # 実際のレンダリング実行
    result=bpy.ops.render.render(write_still=True)
    print("Rendered to:", bpy.context.scene.render.filepath)


    # exit code で結果を返す
    if result == {'FINISHED'}:
        sys.exit(0)
    else:
        sys.exit(1)



# # ひとまず無限ループ
# while True:
#   pass

if __name__ == "__main__":
    # sys.argv[0] はスクリプト名なので、最初の引数は sys.argv[1]
    if len(sys.argv) < 2:
        print("Usage: python render_worker.py <output_dir>")
        sys.exit(1)
    _, output_dir = sys.argv
    main(output_dir)