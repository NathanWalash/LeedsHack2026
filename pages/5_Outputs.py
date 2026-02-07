import streamlit as st

from src.flow import guard_step, hide_default_sidebar_nav, render_debug_tools, render_top_process_nav, unlock_step
from src.ui import apply_ui_theme, render_card_intro, render_page_banner

hide_default_sidebar_nav()
apply_ui_theme()
guard_step(4)
render_debug_tools(4)

render_top_process_nav(4)
render_page_banner(
    "Step 4 of 5",
    "Outputs",
    "Select visual widgets and arrange a concise report canvas for your project.",
)

left, right = st.columns([1, 2], gap="large")
with left:
    render_card_intro("Widget Picker", "Choose chart modules to add into your report.")
    with st.form("widget_picker_form"):
        st.multiselect(
            "Widget types",
            [
                "Time series line",
                "Rolling average",
                "Correlation heatmap",
                "Scatter y vs driver",
                "Forecast chart",
                "Residual error over time",
            ],
            default=["Forecast chart"],
        )
        st.text_input("Widget title", placeholder="e.g., Baseline vs Multivariate Forecast")
        st.text_area("Auto-caption", placeholder="One-sentence interpretation.")
        st.form_submit_button("Add to Report", use_container_width=True, type="primary")

with right:
    render_card_intro("Report Canvas", "Stacked output cards will render here.")
    st.info("Stub: widget cards with edit, reorder, and remove actions.")

st.divider()
col_back, col_next = st.columns(2)
with col_back:
    if st.button("Back to Train and Forecast", use_container_width=True):
        st.switch_page("pages/4_Train_Forecast.py")
with col_next:
    if st.button("Continue to Showcase", use_container_width=True, type="primary"):
        unlock_step(5)
        st.switch_page("pages/6_Showcase.py")



