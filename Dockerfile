FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    curl gnupg2 supervisor mysql-server redis-server \
    openjdk-11-jre-headless git python3 build-essential \
    gettext-base netcat-openbsd && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /opt/fuseki \
    && curl -L -o /tmp/fuseki.tar.gz \
    https://archive.apache.org/dist/jena/binaries/apache-jena-fuseki-4.10.0.tar.gz \
    && tar -xzf /tmp/fuseki.tar.gz -C /opt/fuseki --strip-components=1 \
    && rm /tmp/fuseki.tar.gz \
    && chmod +x /opt/fuseki/fuseki-server
WORKDIR /opt/ot-node
RUN git clone --depth=1 --branch v8/develop \
    https://github.com/OriginTrail/ot-node.git . \
    && npm install --omit=dev --ignore-scripts
RUN mkdir -p /opt/ot-node/data /opt/fuseki/databases /var/log/supervisor /var/run/mysqld \
    && chown -R mysql:mysql /var/run/mysqld
COPY .origintrail_noderc.template /opt/ot-node/.origintrail_noderc.template
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start-node.sh /opt/ot-node/start-node.sh
COPY entrypoint.sh /entrypoint.sh
COPY pre-start.js /opt/pre-start.js
COPY derive-management-wallet.js /opt/derive-management-wallet.js
RUN chmod +x /entrypoint.sh /opt/ot-node/start-node.sh
EXPOSE 8900 9100
ENTRYPOINT ["/entrypoint.sh"]
