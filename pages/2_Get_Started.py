import streamlit as st

st.title("Get Started")

st.subheader("Project Details")
project_title = st.text_input("Project title")
project_desc = st.text_area("Short description")
use_case = st.selectbox("Use case", ["NHS waiting list forecasting", "Other"])

st.subheader("Dataset Upload")
st.file_uploader("Upload CSV/XLSX files", type=["csv", "xlsx"], accept_multiple_files=True)

st.info("Stub: parse files, detect date column, show dataset cards")

st.divider()
if st.button("Continue to Processing"):
    st.info("Stub: validate + store project and dataset metadata")
