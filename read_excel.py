import pandas as pd
import os

try:
    # 读取Excel文件
    df = pd.read_excel('名单.xls')
    
    # 显示前几行数据
    print("Excel文件内容预览:")
    print(df.head())
    
    # 显示列名
    print("\n列名:")
    print(df.columns.tolist())
    
    # 显示数据类型
    print("\n数据类型:")
    print(df.dtypes)
    
except Exception as e:
    print(f"读取Excel文件出错: {e}")
    
    # 尝试使用openpyxl读取
    try:
        import openpyxl
        wb = openpyxl.load_workbook('名单.xls', read_only=True)
        sheet = wb.active
        
        print("\n使用openpyxl尝试读取:")
        # 读取前5行
        for row in sheet.iter_rows(min_row=1, max_row=5, values_only=True):
            print(row)
            
    except Exception as e2:
        print(f"openpyxl读取也失败: {e2}")