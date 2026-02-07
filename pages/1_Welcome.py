import streamlit as st

from src.flow import hide_default_sidebar_nav, init_flow_state, render_debug_tools, start_flow
from src.ui import apply_ui_theme, render_page_banner

hide_default_sidebar_nav()
apply_ui_theme()
init_flow_state()
render_debug_tools(0)

st.markdown(
    """
<style>
.welcome-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.7rem;
    margin-top: 0.35rem;
    margin-bottom: 1rem;
}
.welcome-step {
    border: 1px solid #2c4158;
    border-radius: 14px;
    padding: 0.85rem;
    background: linear-gradient(180deg, #132234 0%, #0f1b2a 100%);
}
.welcome-step .kicker {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #8ab2d8;
    font-weight: 700;
}
.welcome-step .title {
    margin-top: 0.3rem;
    font-size: 1.02rem;
    font-weight: 700;
    color: #d8e8f8;
}
.welcome-step .desc {
    margin-top: 0.25rem;
    font-size: 0.92rem;
    color: #97b2cd;
}
@media (max-width: 900px) {
    .welcome-grid {
        grid-template-columns: 1fr;
    }
}
</style>
""",
    unsafe_allow_html=True,
)

render_page_banner(
    "LeedsHack2026",
    "Forecasting workflow with guided steps",
    "Start once, move forward in sequence, and publish a clean showcase at the end.",
)

st.markdown(
    """
<div class="welcome-grid">
  <div class="welcome-step">
    <div class="kicker">Step 1</div>
    <div class="title">Get Started</div>
    <div class="desc">Create project details and upload your source datasets.</div>
  </div>
  <div class="welcome-step">
    <div class="kicker">Step 2-3</div>
    <div class="title">Process and Forecast</div>
    <div class="desc">Clean, merge, and train baseline plus multivariate models.</div>
  </div>
  <div class="welcome-step">
    <div class="kicker">Step 4-5</div>
    <div class="title">Report and Showcase</div>
    <div class="desc">Build report widgets and publish your final project summary.</div>
  </div>
</div>
""",
    unsafe_allow_html=True,
)

if st.button("Get Started", use_container_width=True, type="primary"):
    start_flow()
    st.switch_page("pages/2_Get_Started.py")


