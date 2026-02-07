import streamlit as st

from src.flow import hide_default_sidebar_nav, init_flow_state
from src.ui import apply_ui_theme

st.set_page_config(
    page_title="LeedsHack2026 Forecasting",
    layout="wide",
    initial_sidebar_state="collapsed",
)

hide_default_sidebar_nav()
apply_ui_theme()
init_flow_state()

# Session state bootstrap for app data objects.
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

st.switch_page("pages/1_Welcome.py")
