#!/bin/sh
# 确保数据目录存在
mkdir -p /app/db/data

# 检查数据库文件是否存在（db.js 使用的是 /app/db/data/database.db）
if [ ! -f "/app/db/data/database.db" ]; then
    echo "Initializing database from backup..."
    # 如果没有，从备份恢复
    if [ -f "/app/data/data-backend.tar.gz" ]; then
        # 解压到临时目录
        mkdir -p /tmp/db_restore
        tar -xzf /app/data/data-backend.tar.gz -C /tmp/db_restore

        # 移动数据库文件到正确位置（db.js 使用 /app/db/data/database.db）
        if [ -f "/tmp/db_restore/database.db" ]; then
            cp /tmp/db_restore/database.db /app/db/data/
            echo "Database restored successfully."
        elif [ -f "/tmp/db_restore/data/database.db" ]; then
            cp /tmp/db_restore/data/database.db /app/db/data/
            echo "Database restored successfully."
        else
            echo "Warning: database.db not found in backup."
        fi

        # 清理临时文件
        rm -rf /tmp/db_restore
    else
        echo "Warning: Backup file not found at /app/data/data-backend.tar.gz"
    fi
else
    echo "Database already exists at /app/db/data/database.db"
fi

# 启动应用
exec "$@"
