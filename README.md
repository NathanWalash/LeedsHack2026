# LeedsHack2026 Streamlit MVP

A minimal multipage Streamlit skeleton based on the provided MVP spec. This repo sets up the folder structure, stub pages, and placeholder modules so the team can start implementing functionality immediately.

## Quick Start

1. Create a virtual environment and install Streamlit.
2. Run the app from the repo root:

```bash
streamlit run app.py
```

## Structure

```
app.py
/pages
  1_Welcome.py
  2_Get_Started.py
  3_Process_Data.py
  4_Train_Forecast.py
  5_Outputs.py
  6_Showcase.py
/src
  ingest.py
  pipeline.py
  models.py
  charts.py
  chat_flow.py
  export.py
/data
  waiting_list_weekly.csv
  weather_weekly.csv
  google_trends_flu.csv
```

## What's Included

- Multipage Streamlit skeleton with page titles and placeholder UI
- Session state bootstrap (core objects) in `app.py`
- Stubs for data ingest, pipeline, models, charts, chat flow, and export
- Placeholder data files in `data/`

## Next Steps

- Implement upload handling in `2_Get_Started.py`
- Build pipeline config + transformations in `3_Process_Data.py`
- Add training and forecasting in `4_Train_Forecast.py`
- Create report widgets in `5_Outputs.py`
- Generate showcase exports in `6_Showcase.py`
