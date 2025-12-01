#!/bin/sh
# 检查db目录下是否有数据库文件
if [ ! -f "/app/db/database.db" ]; then
    echo "Initializing database from backup..."
    # 如果没有，从备份恢复
    if [ -f "/app/data/data-backend.tar.gz" ]; then
        # 解压到临时目录
        mkdir -p /tmp/db_restore
        tar -xzf /app/data/data-backend.tar.gz -C /tmp/db_restore
        
        # 移动数据库文件到正确位置
        # 根据之前的tar -tf结果，文件在根目录下的db.js, database.db等
        # 我们只需要database.db
        if [ -f "/tmp/db_restore/database.db" ]; then
            cp /tmp/db_restore/database.db /app/db/
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
    echo "Database already exists."
fi

# 启动应用
exec "$@"
