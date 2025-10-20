# 使用Node.js官方镜像作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制server目录下的所有源代码
COPY server/ ./

# 创建必要的目录
RUN mkdir -p uploads data

# 设置环境变量
ENV NODE_ENV=production

# 暴露服务器端口
EXPOSE 3001

# 启动服务器
CMD ["node", "index.js"]