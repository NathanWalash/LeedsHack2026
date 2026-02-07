import streamlit as st

st.set_page_config(
    page_title="LeedsHack2026 Forecasting",
    layout="wide",
)

st.title("LeedsHack2026 Forecasting")
st.caption("MVP skeleton: upload, process, forecast, report, showcase")

# Session state bootstrap
DEFAULT_STATE = {
    "project": None,
    "raw_files": [],
    "raw_dfs": {},
    "meta": {},
    "pipeline_config": {},
    "clean_dfs": {},
    "merged_df": None,
    "features_df": None,
    "models": {},
    "metrics": {},
    "predictions": {},
    "report_widgets": [],
    "showcase": {},
}

for key, value in DEFAULT_STATE.items():
    if key not in st.session_state:
        st.session_state[key] = value

st.markdown("""
Use the navigation in the sidebar to open each page.

**Build order**
1. Welcome + Get Started
2. Process Data
3. Train & Forecast
4. Outputs
5. Showcase
""")
