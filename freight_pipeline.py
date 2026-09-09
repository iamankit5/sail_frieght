import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime

def fetch_and_build_dataset(start_date="2021-01-01", end_date=None):
    if end_date is None:
        end_date = datetime.today().strftime('%Y-%m-%d')
        
    print(f"Fetching market data from {start_date} to {end_date}...")

    tickers = {
        'Bunker_Oil': 'CL=F',
        'Dry_Bulk_Index': 'BDRY',
        'USD_INR': 'USDINR=X',
        'Commodity_Gold': 'GC=F'
    }
    
    data_frames = []
    for feature_name, ticker_sym in tickers.items():
        ticker_data = yf.download(ticker_sym, start=start_date, end=end_date, progress=False)
        if not ticker_data.empty:
            series = ticker_data['Close'].squeeze().rename(feature_name)
            data_frames.append(series)

    master_df = pd.concat(data_frames, axis=1)
    master_df.index = pd.to_datetime(master_df.index)

    full_calendar = pd.date_range(start=master_df.index.min(), end=master_df.index.max(), freq='D')
    master_df = master_df.reindex(full_calendar)
    
    master_df = master_df.ffill().bfill()

    # Shift moving averages by 1 day to prevent data leakage (ensuring feature uses t-1 data, not current day t)
    master_df['BDI_MA7'] = master_df['Dry_Bulk_Index'].rolling(window=7).mean().shift(1)
    master_df['BDI_MA30'] = master_df['Dry_Bulk_Index'].rolling(window=30).mean().shift(1)
    master_df['Oil_Daily_Return'] = master_df['Bunker_Oil'].pct_change().shift(1)
    
    master_df = master_df.dropna()

    return master_df

if __name__ == "__main__":
    df = fetch_and_build_dataset()
    print("\n--- Processed Dataset Sample ---")
    print(df.tail())
    
    df.to_csv("processed_freight_training_data.csv")
    print("\nDataset successfully saved to 'processed_freight_training_data.csv'")