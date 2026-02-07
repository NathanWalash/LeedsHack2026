import streamlit as st

st.title("Outputs")

left, right = st.columns([1, 2])
with left:
    st.subheader("Widget Picker")
    st.write("Stub: list of widget types")
    st.button("Add Forecast Chart")
    st.button("Add Correlation Heatmap")

with right:
    st.subheader("Report Canvas")
    st.write("Stub: stacked widget cards")

st.info("Stub: save report_widgets to session state")
