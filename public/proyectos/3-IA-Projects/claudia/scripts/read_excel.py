import pandas as pd


def read_excel_file(file_path):
    try:
        df = pd.read_excel(file_path, header=None)
        print(df.to_string())
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")


if __name__ == "__main__":
    read_excel_file(
        "C:\\Users\\pablo\\claudia_bot\\APU\\APU Ondac\\A FAENA\\CASETA PRE-FAB. CUIDADOR 2 m2.xlsx"
    )
