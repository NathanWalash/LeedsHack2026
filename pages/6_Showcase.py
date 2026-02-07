import streamlit as st

from src.flow import guard_step, hide_default_sidebar_nav, render_debug_tools, render_top_process_nav
from src.ui import apply_ui_theme, render_card_intro, render_page_banner

hide_default_sidebar_nav()
apply_ui_theme()
guard_step(5)
render_debug_tools(5)

render_top_process_nav(5)
render_page_banner(
    "Step 5 of 5",
    "Showcase",
    "Package insights, attach visuals, tag the project, and publish the final summary.",
)

render_card_intro("Showcase Summary", "Narrative block for what you predicted, drivers used, and impact.")
with st.form("showcase_summary_form"):
    st.text_area(
        "Project summary",
        placeholder="Describe outcomes, model uplift, and key operational insight.",
        height=150,
    )
    st.text_input("Tags (comma-separated)", placeholder="NHS, forecasting, multivariate")
    st.form_submit_button("Save Summary", use_container_width=True, type="primary")

render_card_intro("Assets and Export", "Upload screenshots and trigger export stubs.")
with st.form("showcase_assets_form"):
    st.file_uploader("Upload screenshots", type=["png", "jpg"], accept_multiple_files=True)
    st.form_submit_button("Save Assets", use_container_width=True, type="primary")

st.button("Publish Showcase", use_container_width=True, type="primary")
st.info("Stub: generate config.json, predictions.csv, and merged_df.csv.")

st.divider()
if st.button("Back to Outputs", use_container_width=True):
    st.switch_page("pages/5_Outputs.py")



