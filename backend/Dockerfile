# Node.js 后端服务 Dockerfile

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 创建数据目录
RUN mkdir -p data

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["npm", "start"]
