# https://zenn.dev/berry_blog/articles/60c81049059bbb

FROM ubuntu:22.04 AS blender-installer
RUN apt-get update
RUN apt-get install -y xz-utils

RUN mkdir -p /workspace/blender
WORKDIR /workspace

ARG ARCHIVE_FILE="blender-4.4.3-linux-x64.tar.xz"
COPY ./downloads/${ARCHIVE_FILE} /workspace/
RUN tar -xvf "./${ARCHIVE_FILE}" -C blender --strip-components 1


FROM ubuntu:22.04 as runtime

RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
RUN apt-get update && apt-get upgrade -y

RUN mkdir -p /app
WORKDIR /app

ENV TZ=Asia/Tokyo

# blender依存関係のインストール
RUN apt-get install glibc-source -y
RUN apt-get install -y libsm6 libxext6
RUN apt-get install -y libx11-dev libxxf86vm-dev libxcursor-dev libxi-dev libxrandr-dev libxinerama-dev libegl-dev
RUN apt-get install -y libwayland-dev wayland-protocols libxkbcommon-dev libdbus-1-dev linux-libc-dev

# blender本体のインストール
ARG BLENDER_DIR="/usr/local/blender"
# ENV BLENDER_PATH="${BLENDER_DIR}/blender"
# ENV BLENDER_PYTHON_PATH="${BLENDER_DIR}/4.4/python/bin/python3.11"
COPY --from=blender-installer /workspace/blender ${BLENDER_DIR}
ENV PATH="${BLENDER_DIR}:${PATH}"

# pythonのセットアップ
RUN apt-get install -y python3.11
RUN apt-get install -y --fix-missing python3-pip
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1
RUN python -m pip install --upgrade pip setuptools wheel
