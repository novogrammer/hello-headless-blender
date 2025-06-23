FROM ubuntu:22.04 AS runtime

# RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
ENV TZ=Asia/Tokyo

ENV DEBIAN_FRONTEND=noninteractive

ARG NODE_MAJOR=22
RUN apt-get update && apt-get install -y \
    tzdata \
    glibc-source \
    libsm6 libxext6 \
    libx11-dev libxxf86vm-dev libxcursor-dev libxi-dev libxrandr-dev libxinerama-dev libegl-dev \
    libwayland-dev wayland-protocols libxkbcommon-dev libdbus-1-dev linux-libc-dev \
    && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - && \
    apt-get install -y nodejs \
    && apt-get install -y python3.11 \
    && apt-get install -y --fix-missing python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1
RUN python -m pip install --upgrade pip setuptools wheel

RUN mkdir -p /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY requirements.lock .
RUN pip install -r requirements.lock

COPY . .

CMD [ "node", "./index.js" ]

