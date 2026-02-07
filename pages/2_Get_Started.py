import streamlit as st

from src.flow import guard_step, hide_default_sidebar_nav, render_debug_tools, render_top_process_nav, unlock_step
from src.ui import apply_ui_theme, render_card_intro, render_page_banner

hide_default_sidebar_nav()
apply_ui_theme()
guard_step(1)
render_debug_tools(1)

render_top_process_nav(1)
render_page_banner(
    "Step 1 of 5",
    "Get Started",
    "Set project context and upload source files for the processing pipeline.",
)

render_card_intro("Project Details", "Basic metadata used across reports and showcase output.")
with st.form("project_details_form"):
    project_title = st.text_input("Project title", placeholder="e.g., NHS waiting list forecasting")
    project_desc = st.text_area("Short description", placeholder="What are you forecasting and why?")
    use_case = st.selectbox("Use case", ["NHS waiting list forecasting", "Other"])
    save_details = st.form_submit_button("Save Project Details", use_container_width=True, type="primary")

if save_details:
    st.session_state["project"] = {
        "title": project_title,
        "description": project_desc,
        "use_case": use_case,
    }
    st.success("Project details saved.")

render_card_intro("Dataset Upload", "Upload one or more CSV/XLSX files. Parsing is still stubbed.")
with st.form("upload_form"):
    files = st.file_uploader("Upload CSV/XLSX files", type=["csv", "xlsx"], accept_multiple_files=True)
    submit_upload = st.form_submit_button("Save Uploaded Files", use_container_width=True, type="primary")

if submit_upload:
    st.session_state["raw_files"] = [f.name for f in files] if files else []
    st.info("Stub: parse files, detect date column, and generate dataset cards.")

st.divider()
col_back, col_next = st.columns(2)
with col_back:
    if st.button("Back to Welcome", use_container_width=True):
        st.switch_page("pages/1_Welcome.py")
with col_next:
    can_continue = bool(st.session_state.get("project"))
    if st.button("Continue to Processing", use_container_width=True, type="primary", disabled=not can_continue):
        unlock_step(2)
        st.switch_page("pages/3_Process_Data.py")


