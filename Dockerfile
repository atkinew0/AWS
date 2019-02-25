FROM ubuntu


# Do not exclude man pages & other documentation
RUN rm /etc/dpkg/dpkg.cfg.d/excludes
# Reinstall all currently installed packages in order to get the man pages back
RUN apt-get update && \
    dpkg -l | grep ^ii | cut -d' ' -f3 | xargs apt-get install -y --reinstall && \
    rm -r /var/lib/apt/lists/*

WORKDIR /bin
RUN useradd --create-home -s /bin/bash user
RUN apt-get update && apt-get install -y less file lsof lshw binutils pciutils man
RUN apt-get install -y git curl netcat iputils-ping iproute2

COPY copy/* ./
USER user
WORKDIR /home
