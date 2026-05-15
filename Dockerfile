FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl gnupg2 lsb-release supervisor \
    mysql-server redis-server \
    openjdk-11-jre-headless \
    git python3 python3-pip build-essential \
    gettext-base netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Blazegraph
RUN mkdir -p /opt/blazegraph \
    && curl -L -o /opt/blazegraph/blazegraph.jar \
    https://github.com/blazegraph/database/releases/download/BLAZEGRAPH_2_1_6_RC/blazegraph.jar

# ot-node
WORKDIR /opt/ot-node
RUN git clone --depth=1 --branch v8/develop \
    https://github.com/OriginTrail/ot-node.git . \
    && npm install --omit=dev

RUN mkdir -p /opt/ot-node/data /var/log/supervisor /var/run/mysqld \
    && chown -R mysql:mysql /var/run/mysqld

COPY .origintrail_noderc.template /opt/ot-node/.origintrail_noderc.template
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start-node.sh /opt/ot-node/start-node.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh /opt/ot-node/start-node.sh

EXPOSE 8900 9100

ENTRYPOINT ["/entrypoint.sh"]
