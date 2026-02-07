import streamlit as st

from src.flow import guard_step, hide_default_sidebar_nav, render_debug_tools, render_top_process_nav, unlock_step
from src.ui import apply_ui_theme, render_card_intro, render_page_banner

hide_default_sidebar_nav()
apply_ui_theme()
guard_step(2)
render_debug_tools(2)

render_top_process_nav(2)
render_page_banner(
    "Step 2 of 5",
    "Process Data",
    "Configure cleaning, merging, and feature choices before running the pipeline.",
)

left, right = st.columns([1, 2], gap="large")
with left:
    render_card_intro("Chat Guide", "Stubbed intent actions for guided ETL steps.")
    with st.form("chat_guide_form"):
        st.radio("Quick intent", ["clean", "merge", "explain", "next"], horizontal=True)
        st.text_area("Assistant note", placeholder="Why this step matters and what changed.", height=140)
        st.form_submit_button("Apply Chat Step", use_container_width=True, type="primary")

with right:
    render_card_intro("Pipeline Preview", "Current config and before/after snapshot placeholders.")
    with st.form("pipeline_preview_form"):
        freq = st.selectbox("Frequency", ["weekly", "daily", "monthly"], index=0)
        missing = st.selectbox("Missing value strategy", ["forward fill", "interpolate", "drop"])
        outliers = st.selectbox("Outlier strategy", ["none", "clip percentiles", "flag"])
        merge = st.selectbox("Merge strategy", ["outer join + fill", "inner join"])
        st.multiselect("Default lags", [1, 2, 4, 8], default=[1, 2, 4])
        st.checkbox("Add calendar features", value=True)
        st.form_submit_button("Save Pipeline Config", use_container_width=True, type="primary")

st.info("Stub: run preprocessing and feature generation.")

st.divider()
col_back, col_next = st.columns(2)
with col_back:
    if st.button("Back to Get Started", use_container_width=True):
        st.switch_page("pages/2_Get_Started.py")
with col_next:
    if st.button("Run Pipeline and Continue", use_container_width=True, type="primary"):
        unlock_step(3)
        st.switch_page("pages/4_Train_Forecast.py")



