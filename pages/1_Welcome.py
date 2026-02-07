import streamlit as st

st.title("Welcome")
st.write("Start a new project or load the demo data.")

col1, col2, col3 = st.columns(3)
with col1:
    st.subheader("Upload")
    st.write("Bring your CSV/XLSX datasets.")
with col2:
    st.subheader("Process")
    st.write("Clean, merge, and engineer features.")
with col3:
    st.subheader("Forecast")
    st.write("Train baseline + multivariate models.")

st.divider()

left, right = st.columns(2)
with left:
    if st.button("Create New Project", use_container_width=True):
        st.info("Stub: route to Get Started")
with right:
    if st.button("Try Demo Project", use_container_width=True):
        st.info("Stub: load demo data and route to Process Data")
