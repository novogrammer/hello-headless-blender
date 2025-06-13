# https://zenn.dev/berry_blog/articles/60c81049059bbb

FROM ubuntu:22.04 AS blender-installer

RUN apt-get update && apt-get install -y \
    xz-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /workspace/blender
WORKDIR /workspace

ARG ARCHIVE_FILE="blender-4.4.3-linux-x64.tar.xz"
COPY ./downloads/${ARCHIVE_FILE} /workspace/
RUN tar -xvf "./${ARCHIVE_FILE}" -C blender --strip-components 1


FROM ubuntu:22.04 as runtime

# RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
ENV TZ=Asia/Tokyo

RUN apt-get update && apt-get install -y \
    glibc-source \
    libsm6 libxext6 \
    libx11-dev libxxf86vm-dev libxcursor-dev libxi-dev libxrandr-dev libxinerama-dev libegl-dev \
    libwayland-dev wayland-protocols libxkbcommon-dev libdbus-1-dev linux-libc-dev \
    && apt-get install -y python3.11 \
    && apt-get install -y --fix-missing python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1
RUN python -m pip install --upgrade pip setuptools wheel

RUN mkdir -p /app
WORKDIR /app

# blender本体のインストール
ARG BLENDER_DIR="/usr/local/blender"
# ENV BLENDER_PATH="${BLENDER_DIR}/blender"
# ENV BLENDER_PYTHON_PATH="${BLENDER_DIR}/4.4/python/bin/python3.11"
COPY --from=blender-installer /workspace/blender ${BLENDER_DIR}
ENV PATH="${BLENDER_DIR}:${PATH}"


