import streamlit as st

from src.flow import guard_step, hide_default_sidebar_nav, render_debug_tools, render_top_process_nav, unlock_step
from src.ui import apply_ui_theme, render_card_intro, render_page_banner

hide_default_sidebar_nav()
apply_ui_theme()
guard_step(3)
render_debug_tools(3)

render_top_process_nav(3)
render_page_banner(
    "Step 3 of 5",
    "Train and Forecast",
    "Set model options, run baseline and multivariate experiments, and compare metrics.",
)

render_card_intro("Model Settings", "These controls shape train/test evaluation and forecast horizon.")
with st.form("model_settings_form"):
    horizon = st.selectbox("Forecast horizon (weeks)", [4, 8, 12], index=1)
    train_split = st.slider("Train/Test split", min_value=0.6, max_value=0.9, value=0.8)
    baseline = st.selectbox("Baseline model", ["Prophet", "ARIMA", "MovingAvg"])
    multivariate = st.selectbox("Multivariate model", ["RandomForest", "XGBoost"])
    st.form_submit_button("Save Model Settings", use_container_width=True, type="primary")

render_card_intro("Run Models", "Execution buttons are stubbed but laid out for demo flow.")
col1, col2, col3 = st.columns(3)
with col1:
    st.button("Run Baseline", use_container_width=True, type="secondary")
with col2:
    st.button("Run Multivariate", use_container_width=True, type="secondary")
with col3:
    st.button("Compare", use_container_width=True, type="secondary")

render_card_intro("Results", "Charts, metrics, and explainability output placeholders.")
st.info("Stub: actual vs predicted plots, RMSE/MAPE cards, feature importance, and ELI5 text.")

st.divider()
col_back, col_next = st.columns(2)
with col_back:
    if st.button("Back to Process Data", use_container_width=True):
        st.switch_page("pages/3_Process_Data.py")
with col_next:
    if st.button("Continue to Outputs", use_container_width=True, type="primary"):
        unlock_step(4)
        st.switch_page("pages/5_Outputs.py")



