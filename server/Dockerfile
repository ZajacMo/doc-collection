# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装构建依赖并安装生产依赖
RUN apk add --no-cache python3 make g++ py3-setuptools \
 && npm install --omit=dev
ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3

# 复制server目录下的所有源代码
COPY server/ ./

# 复制entrypoint脚本
COPY server/entrypoint.sh ./
RUN chmod +x entrypoint.sh

# 创建必要的目录
RUN mkdir -p uploads db data

# 复制数据备份
COPY server/data/data-backend.tar.gz ./data/

# 设置环境变量
ENV NODE_ENV=production

# 暴露服务器端口
EXPOSE 3001

# 使用entrypoint脚本启动
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "index.js"]