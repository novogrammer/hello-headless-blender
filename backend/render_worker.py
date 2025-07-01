import sys
import tempfile
import bpy
import os



def main(work_dir):

    # blender_filepath=os.path.abspath("./scenes/simple.blend")
    blender_filepath=os.path.abspath("./scenes/suzanne.blend")

    bpy.ops.wm.open_mainfile(filepath=blender_filepath)

    mat = bpy.data.materials["MaterialSuzanne"]
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    tex_node = nodes.get("Image Texture")
    color_filepath = os.path.join(work_dir, "image.jpg")
    img = bpy.data.images.load(color_filepath)
    tex_node.image = img

    bpy.context.scene.render.image_settings.file_format = 'FFMPEG'
    bpy.context.scene.render.ffmpeg.format = 'MPEG4'
    bpy.context.scene.render.ffmpeg.codec = 'H264'

    # output_filepath = os.path.join(work_dir, "result.png")
    output_filepath = os.path.join(work_dir, "result.mp4")
    bpy.context.scene.render.filepath = output_filepath

    # bpy.context.scene.render.resolution_x = 1080
    # bpy.context.scene.render.resolution_y = 1080
    bpy.context.scene.render.resolution_x = 256
    bpy.context.scene.render.resolution_y = 256

    # レンダーエンジン設定（'CYCLES' or 'BLENDER_EEVEE_NEXT'）
    # bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'

    frame_start = bpy.context.scene.frame_start
    frame_end = bpy.context.scene.frame_end
    print(f"Render Animation frame_start:{frame_start} frame_end:{frame_end}",flush=True)

    # 実際のレンダリング実行
    # result=bpy.ops.render.render(write_still=True)
    result=bpy.ops.render.render(write_still=True,animation=True)
    
    print("Rendered to:", bpy.context.scene.render.filepath,flush=True)


    # exit code で結果を返す
    if result == {'FINISHED'}:
        sys.exit(0)
    else:
        sys.exit(1)



if __name__ == "__main__":
    # sys.argv[0] はスクリプト名なので、最初の引数は sys.argv[1]
    if len(sys.argv) < 2:
        print("Usage: python render_worker.py <work_dir>")
        sys.exit(1)
    _, work_dir = sys.argv
    main(work_dir)
